// Google Calendar entegrasyonu — bağlantı durumu ve .ics (iCalendar) dışa aktarım yardımcıları.
//
// ÖNEMLİ: Bu ortamda gerçek Google OAuth akışı (kullanıcıyı accounts.google.com'a
// yönlendirip token almak) çalıştırılamaz — bunun için gerçek bir Google Cloud
// projesi, OAuth Client ID/Secret ve onaylı bir redirect URI gerekir. Aşağıdaki
// bağlantı durumu bu yüzden yerel olarak (localStorage) simüle edilir; formu
// dolduran kullanıcı "bağlandı" sayılır. Üretimde bu dosya gerçek OAuth2 + Google
// Calendar REST API çağrılarıyla değiştirilir; arayüz (Entegrasyonlar/Takvim
// sayfaları) zaten bu veri şekliyle çalışmaya hazırdır.
//
// Gerçek ve çalışan kısım: aşağıdaki .ics üretimi — iş emirlerini standart
// iCalendar formatında dışa aktarır, Google Calendar/Outlook/Apple Calendar'a
// içe aktarılabilir (RFC 5545 uyumlu).

import type { WorkOrder } from "@/lib/mock/crm";

const STORAGE_KEY = "pestshield.integrations.googleCalendar";

export interface GoogleCalendarConnection {
  connected: boolean;
  clientId: string;
  calendarId: string;
  connectedAt: string | null;
}

const DEFAULT_CONNECTION: GoogleCalendarConnection = {
  connected: false,
  clientId: "",
  calendarId: "",
  connectedAt: null,
};

export function getGoogleCalendarConnection(): GoogleCalendarConnection {
  if (typeof window === "undefined") return DEFAULT_CONNECTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONNECTION;
    return { ...DEFAULT_CONNECTION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONNECTION;
  }
}

export function saveGoogleCalendarConnection(conn: GoogleCalendarConnection) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conn));
}

export function disconnectGoogleCalendar() {
  saveGoogleCalendarConnection(DEFAULT_CONNECTION);
}

function icsEscape(value: string): string {
  return value.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

function toIcsDate(dateStr: string): string {
  // plannedDate "YYYY-MM-DD" -> tüm gün etkinliği (VALUE=DATE)
  return dateStr.replace(/-/g, "");
}

/** İş emirlerinden RFC 5545 uyumlu bir .ics takvim dosyası içeriği üretir. */
export function generateIcsContent(orders: (WorkOrder & { customerName?: string })[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const events = orders
    .map((order) => {
      const uid = `${order.id}@pestshield.app`;
      const dt = toIcsDate(order.plannedDate);
      const summary = icsEscape(`${order.serviceType} — ${order.customerName ?? "Müşteri"}`);
      const description = icsEscape(`İş Emri No: ${order.orderNo}\\nTeknisyen: ${order.technician}\\nDurum: ${order.status}`);
      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dt}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PestShield//Servis Takvimi//TR", "CALSCALE:GREGORIAN", events, "END:VCALENDAR"].join(
    "\r\n",
  );
}

export function downloadIcsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
