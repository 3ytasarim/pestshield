export function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Google'ın döndürdüğü ISO/tarih değerini toKey ile aynı anahtar biçimine çevirir. */
export function googleEventDayKey(iso: string): string {
  return toKey(new Date(iso));
}

/** Saatli bir Google Takvim ISO zaman damgasını yerel "HH:mm" olarak döner. */
export function googleEventTimeKey(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

/** Haftanın Pazartesi'sini (yerel saat 00:00) döner. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
