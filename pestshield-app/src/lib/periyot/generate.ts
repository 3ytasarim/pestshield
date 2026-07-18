import type { PeriyotDonem } from "@/lib/mock/crm";

export const DONEM_LABELS: Record<PeriyotDonem, string> = {
  daily: "Günde bir",
  weekly: "Haftada bir",
  monthly: "Ayda bir",
};

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface GenerateDatesOptions {
  startDate: string;
  endDate: string;
  dayOfMonth: number;
  donem: PeriyotDonem;
}

/** Tarih aralığı + sıklığa göre uygulama tarihlerini üretir (saf fonksiyon, `periyot-store.ts::generateBatch` ile birebir aynı algoritma). */
export function generatePeriyotDates({ startDate, endDate, dayOfMonth, donem }: GenerateDatesOptions): string[] {
  const dates: string[] = [];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (donem === "daily") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(toLocalIso(d));
    }
  } else if (donem === "weekly") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
      dates.push(toLocalIso(d));
    }
  } else {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const day = Math.min(dayOfMonth, daysInMonth);
      const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      if (occurrenceDate >= start && occurrenceDate <= end) {
        dates.push(toLocalIso(occurrenceDate));
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return dates;
}

export function buildBatchName(namePrefix: string, dateCount: number, donem: PeriyotDonem): string {
  return `${namePrefix} PCO (${dateCount} Periyot her 1 ${DONEM_LABELS[donem]})`;
}
