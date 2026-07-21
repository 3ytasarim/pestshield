import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient, GoogleApiError } from "@/lib/integrations/google-calendar/client";
import { ensureFreshAccessToken } from "@/lib/integrations/google-calendar/sync";

export interface MergedGoogleEvent {
  id: string;
  calendarId: string;
  calendarName: string;
  color?: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Google Calendar'a doğrudan (PestShield dışında) girilmiş etkinlikleri
// Takvim sayfasında salt-okunur göstermek içindir — senkronizasyon değil,
// hiçbir şey yazmaz/değiştirmez, sadece hesaba bağlı tüm takvimleri okur.
export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
    return NextResponse.json({ message: "Geçersiz tarih aralığı (start/end YYYY-MM-DD bekleniyor)." }, { status: 400 });
  }

  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!integration || !integration.accessTokenEnc) {
    return NextResponse.json({ events: [] });
  }

  try {
    const accessToken = await ensureFreshAccessToken(integration);
    const timeMin = new Date(`${start}T00:00:00.000Z`).toISOString();
    const timeMax = new Date(`${end}T00:00:00.000Z`).toISOString();

    const calendars = await googleCalendarClient.listCalendars(accessToken);
    const events: MergedGoogleEvent[] = [];

    for (const cal of calendars) {
      try {
        const calEvents = await googleCalendarClient.listEvents(accessToken, cal.id, timeMin, timeMax);
        for (const e of calEvents) {
          events.push({ ...e, calendarId: cal.id, calendarName: cal.summary, color: cal.backgroundColor });
        }
      } catch {
        // Tek bir takvim okunamazsa (ör. erişim kaldırılmış) diğerlerini etkilemesin.
      }
    }

    return NextResponse.json({ events });
  } catch (err) {
    const message = err instanceof GoogleApiError ? err.message : err instanceof Error ? err.message : "Google Takvim etkinlikleri alınamadı.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
