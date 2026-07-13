export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

/** "05 Mayıs 2027, Çarşamba" biçimi — Periyot tabloları için. */
export function formatDateLong(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" }).format(
    new Date(iso),
  );
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

/** Türkçe para birimi biçimi: sembol tutarın SONUNDA yer alır (Intl'in bazı ortamlarda ürettiği "₺1.000" yerine "1.000 ₺"). */
export function formatCurrency(value: number, currency = "TRY"): string {
  const formatted = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${formatted} ${symbol}`;
}

export function formatFileSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
