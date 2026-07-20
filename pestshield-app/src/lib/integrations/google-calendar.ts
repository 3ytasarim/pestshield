// Google Calendar .ics (iCalendar) dışa aktarım yardımcıları — iş emirlerini
// standart iCalendar formatında dışa aktarır, Google Calendar/Outlook/Apple
// Calendar'a içe aktarılabilir (RFC 5545 uyumlu). Gerçek OAuth2 tabanlı canlı
// senkronizasyon için bkz. src/lib/integrations/google-calendar/ (client.ts, sync.ts).

import type { WorkOrder } from "@/lib/mock/crm";

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
