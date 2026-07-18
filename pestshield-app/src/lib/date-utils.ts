/** Yerel (sunucu saat dilimi) tarihi "YYYY-MM-DD" olarak döner — toISOString() UTC kullandığından gece yarısına yakın saatlerde bir gün geriye kayabilir. */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayStr(): string {
  return toLocalDateStr(new Date());
}
