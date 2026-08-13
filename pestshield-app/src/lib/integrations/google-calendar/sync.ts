import "server-only";
import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { googleCalendarClient, GoogleApiError } from "./client";
import type { GoogleCalendarIntegration } from "@/generated/prisma";

export interface GoogleCalendarSyncResult {
  ok: boolean;
  error?: string;
}

export interface GoogleCalendarBulkSyncResult {
  synced: number;
  error?: string;
}

/** Access token süresi dolmuşsa (veya hiç yoksa) refresh_token ile yeniler ve DB'yi günceller. */
export async function ensureFreshAccessToken(integration: GoogleCalendarIntegration): Promise<string> {
  const expiresAt = integration.tokenExpiresAt?.getTime() ?? 0;
  if (integration.accessTokenEnc && expiresAt > Date.now() + 60_000) {
    return decryptSecret(integration.accessTokenEnc);
  }
  if (!integration.refreshTokenEnc) {
    throw new Error("Google Calendar bağlantısının yenileme token'ı yok — yeniden bağlanmanız gerekiyor.");
  }
  if (!integration.clientId || !integration.clientSecretEnc) {
    throw new Error("Google Calendar Client ID/Secret bilgisi eksik — yeniden bağlanmanız gerekiyor.");
  }
  const refreshToken = decryptSecret(integration.refreshTokenEnc);
  const tokens = await googleCalendarClient.refreshAccessToken(refreshToken, integration.clientId, decryptSecret(integration.clientSecretEnc));

  await prisma.googleCalendarIntegration.update({
    where: { id: integration.id },
    data: {
      accessTokenEnc: encryptSecret(tokens.accessToken),
      // Google refresh_token'ı rotate etmez — yanıtta dönmezse mevcut olanı koru.
      ...(tokens.refreshToken ? { refreshTokenEnc: encryptSecret(tokens.refreshToken) } : {}),
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    },
  });
  return tokens.accessToken;
}

/** Tüm-gün etkinlik için Google'ın beklediği "exclusive end" — bitiş tarihi başlangıçtan bir gün sonrasıdır. */
function nextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const CALENDAR_TIME_ZONE = "Europe/Istanbul";

/** "YYYY-MM-DD" + "HH:mm" birleştirip Google'ın beklediği yerel (offsetsiz) ISO 8601 formatını üretir — timeZone alanı offset'i ayrıca belirtir. */
function toLocalIso(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`;
}

/** plannedEndTime boşsa (sadece başlangıç saati girildiyse) süre 1 saat kabul edilir — gece yarısını geçmez, 23:59'da sınırlanır. */
function deriveEndTime(startTime: string, endTime: string | null): string {
  if (endTime) return endTime;
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = Math.min(h * 60 + m + 60, 23 * 60 + 59);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

/**
 * Bir iş emrini Google Takvim'e yazar/günceller/siler. Takvim bağlı değilse
 * sessizce başarı döner (iş emri işlemleri asla bundan etkilenmemeli).
 * Hata durumunda throw ETMEZ — çağıran taraf (work-order route'ları) bu
 * sonucu görmezden gelebilir.
 */
export async function syncWorkOrderToCalendar(ownerId: string, workOrderId: string): Promise<GoogleCalendarSyncResult> {
  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!integration || !integration.accessTokenEnc) {
    return { ok: true };
  }

  try {
    const order = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { customer: true, technician: true },
    });
    if (!order || order.ownerId !== ownerId) {
      return { ok: false, error: "İş emri bulunamadı." };
    }
    if (!order.syncToCalendar) {
      return { ok: true };
    }

    const accessToken = await ensureFreshAccessToken(integration);
    // Teknisyenin kendi Google alt-takvimi varsa ÖNCELİKLE o kullanılır — "Bekleyen İçe
    // Aktarımlar"dan onaylanan iş emirlerinin googleEventId'si o takvimdeki etkinliğe aittir;
    // burada şirketin ortak takvimine (integration.calendarId) düşülürse upsertEvent 404 alır,
    // yeni bir etkinlik oluşturup googleEventId'yi onunla değiştirir ve orijinal etkinlik hiçbir
    // zaman "aktarıldı" olarak işaretlenmediği için sayfa yenilendiğinde tekrar bekleyen olarak görünür.
    const calendarId = order.technician?.googleCalendarId || integration.calendarId || "primary";

    if (order.status === "cancelled") {
      if (order.googleEventId) {
        await googleCalendarClient.deleteEvent(accessToken, calendarId, order.googleEventId);
        await prisma.workOrder.update({ where: { id: order.id }, data: { googleEventId: null } });
      }
      await prisma.googleCalendarIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date(), lastSyncStatus: "ok" },
      });
      return { ok: true };
    }

    const addressParts = [order.customer.addressLine, order.customer.district, order.customer.city].filter(Boolean);
    const descriptionParts = [
      `İş Emri No: ${order.orderNo}`,
      order.technician ? `Teknisyen: ${order.technician.name}` : null,
      order.riskFinding ? `Bulgu: ${order.riskFinding}` : null,
    ].filter(Boolean);

    // plannedStartTime doluysa SAATLİ etkinlik oluşturulur — aksi halde tüm-gün'e düşülür. Bu
    // ayrım kritik: burada her zaman tüm-gün gönderilirse, "Bekleyen İçe Aktarımlar"dan aktarılan
    // ve googleEventId'si ORİJİNAL saatli etkinliğe ait olan iş emirleri o etkinliği tüm-gün bir
    // etkinlikle EZER (bkz. pending-imports/confirm/route.ts ve calendar-page.tsx confirmImport).
    const eventInput = order.plannedStartTime
      ? {
          summary: `${order.serviceType} — ${order.customer.companyName}`,
          description: descriptionParts.join("\n"),
          location: addressParts.join(", "),
          startDate: order.plannedDate,
          endDate: nextDay(order.plannedDate),
          startDateTime: toLocalIso(order.plannedDate, order.plannedStartTime),
          endDateTime: toLocalIso(order.plannedDate, deriveEndTime(order.plannedStartTime, order.plannedEndTime)),
          timeZone: CALENDAR_TIME_ZONE,
        }
      : {
          summary: `${order.serviceType} — ${order.customer.companyName}`,
          description: descriptionParts.join("\n"),
          location: addressParts.join(", "),
          startDate: order.plannedDate,
          endDate: nextDay(order.plannedDate),
        };

    let result;
    try {
      result = await googleCalendarClient.upsertEvent(accessToken, calendarId, order.googleEventId, eventInput);
    } catch (err) {
      // Kayıtlı googleEventId Google tarafında artık yok (elle silinmiş veya takvim değiştirilmiş) —
      // güncelleme (PUT) 404 döner. Kalıntı id'yi at, yeni bir etkinlik olarak oluştur.
      if (err instanceof GoogleApiError && err.status === 404 && order.googleEventId) {
        result = await googleCalendarClient.upsertEvent(accessToken, calendarId, null, eventInput);
      } else {
        throw err;
      }
    }

    await prisma.workOrder.update({ where: { id: order.id }, data: { googleEventId: result.id } });
    await prisma.googleCalendarIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: "ok" },
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    await prisma.googleCalendarIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: `error: ${message}` },
    });
    return { ok: false, error: message };
  }
}

/** Manuel "Şimdi Senkronize Et" — bugünden itibaren planlanmış tüm iş emirlerini tek tek senkronlar (geçmişi doldurmaz). */
export async function syncUpcomingWorkOrders(ownerId: string): Promise<GoogleCalendarBulkSyncResult> {
  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!integration || !integration.accessTokenEnc) {
    return { synced: 0, error: "Google Calendar bağlantısı kurulmamış." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const orders = await prisma.workOrder.findMany({
    where: { ownerId, plannedDate: { gte: today }, status: { not: "cancelled" } },
    select: { id: true },
  });

  let synced = 0;
  let lastError: string | undefined;
  for (const order of orders) {
    const result = await syncWorkOrderToCalendar(ownerId, order.id);
    if (result.ok) {
      synced += 1;
    } else {
      lastError = result.error;
    }
  }

  await prisma.googleCalendarIntegration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date(), lastSyncStatus: lastError ? `error: ${lastError}` : "ok", lastSyncCount: synced },
  });

  return { synced, error: lastError };
}
