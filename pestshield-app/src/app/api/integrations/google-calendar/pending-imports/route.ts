import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient } from "@/lib/integrations/google-calendar/client";
import { ensureFreshAccessToken } from "@/lib/integrations/google-calendar/sync";

export interface PendingImportEvent {
  googleEventId: string;
  calendarId: string;
  technicianId: string;
  technicianName: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  suggestedCustomerId: string | null;
  suggestedCustomerName: string | null;
}

const WINDOW_DAYS_BACK = 3;
const WINDOW_DAYS_FORWARD = 30;

function normalize(text: string): string {
  return text.toLocaleLowerCase("tr-TR").trim();
}

// Her teknisyenin kendi Google alt-takvimine EKLENMİŞ (PestShield dışında
// oluşturulmuş) etkinlikleri bulur — bu teknisyene önerilen yeni İş Emri
// adayları olarak "Bekleyen İçe Aktarımlar" ekranında listelenir. Hiçbir
// şey otomatik olarak İş Emri'ne dönüştürülmez, sadece öneri sunar.
export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const technicians = await prisma.technician.findMany({
    where: { ownerId, googleCalendarId: { not: null } },
    select: { id: true, name: true, googleCalendarId: true },
  });
  if (technicians.length === 0) {
    return NextResponse.json({ pending: [] });
  }

  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!integration || !integration.accessTokenEnc) {
    return NextResponse.json({ pending: [] });
  }

  const [alreadyImported, customers] = await Promise.all([
    prisma.workOrder.findMany({ where: { ownerId, googleEventId: { not: null } }, select: { googleEventId: true } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true } }),
  ]);
  const importedIds = new Set(alreadyImported.map((w) => w.googleEventId));

  try {
    const accessToken = await ensureFreshAccessToken(integration);
    const timeMin = new Date(Date.now() - WINDOW_DAYS_BACK * 86_400_000).toISOString();
    const timeMax = new Date(Date.now() + WINDOW_DAYS_FORWARD * 86_400_000).toISOString();

    const pending: PendingImportEvent[] = [];

    for (const tech of technicians) {
      if (!tech.googleCalendarId) continue;
      let events;
      try {
        events = await googleCalendarClient.listEvents(accessToken, tech.googleCalendarId, timeMin, timeMax);
      } catch {
        continue; // Bu teknisyenin takvimi okunamadı (ör. erişim kaldırılmış) - diğerlerini etkilemesin.
      }

      for (const event of events) {
        if (importedIds.has(event.id)) continue;

        const haystack = normalize(event.summary);
        const match = customers.find((c) => c.companyName && haystack.includes(normalize(c.companyName)));

        pending.push({
          googleEventId: event.id,
          calendarId: tech.googleCalendarId,
          technicianId: tech.id,
          technicianName: tech.name,
          summary: event.summary,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          suggestedCustomerId: match?.id ?? null,
          suggestedCustomerName: match?.companyName ?? null,
        });
      }
    }

    pending.sort((a, b) => a.start.localeCompare(b.start));
    return NextResponse.json({ pending });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Takvim etkinlikleri alınamadı.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
