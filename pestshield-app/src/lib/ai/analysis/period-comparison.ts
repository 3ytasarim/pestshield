// PestShield AI Command Center — Faz 2 dönem karşılaştırma yardımcıları.
//
// Bu dosya SAF (side-effect'siz) ve deterministiktir. LLM'e aritmetik
// yaptırılmaz — her yüzde/fark/yön hesaplaması burada, test edilebilir
// TypeScript kodunda yapılır (bkz. Faz 2 spesifikasyonu bölüm 4).

export type TrendDirection = "up" | "down" | "flat";

export interface PeriodComparisonResult {
  current: number;
  previous: number;
  absoluteChange: number;
  /** Önceki değer 0 ise yüzde hesaplanamaz — yanıltıcı "sonsuz artış" göstermemek için null döner. */
  percentChange: number | null;
  direction: TrendDirection;
  /** percentChange null olduğunda kullanıcıya gösterilecek Türkçe açıklama. */
  note: string | null;
}

/**
 * İki dönem arasında değişimi hesaplar. Önceki dönem 0 ise yüzde değişim
 * hesaplanmaz (bölme hatası veya yanıltıcı %∞ göstermek yerine).
 */
export function comparePeriods(current: number, previous: number): PeriodComparisonResult {
  const absoluteChange = current - previous;
  const direction: TrendDirection = absoluteChange > 0 ? "up" : absoluteChange < 0 ? "down" : "flat";

  if (previous === 0) {
    return {
      current,
      previous,
      absoluteChange,
      percentChange: null,
      direction: current > 0 ? "up" : "flat",
      note: "Önceki dönemde kayıt bulunmadığı için yüzde değişim hesaplanamadı.",
    };
  }

  const percentChange = Math.round((absoluteChange / previous) * 1000) / 10;
  return { current, previous, absoluteChange, percentChange, direction, note: null };
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Verilen bir dönemin hemen öncesindeki, aynı uzunlukta dönemi hesaplar.
 * Örn. 2026-07-01..2026-07-31 (31 gün) → önceki: 2026-05-31..2026-06-30.
 */
export function previousPeriodOf(range: DateRange): DateRange {
  const start = parseIso(range.startDate);
  const end = parseIso(range.endDate);
  const lengthDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (lengthDays - 1));
  return { startDate: toIso(prevStart), endDate: toIso(prevEnd) };
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export interface RatioResult {
  numerator: number;
  denominator: number;
  /** Payda 0 ise oran hesaplanamaz. */
  ratioPercent: number | null;
}

/** Tamamlanma/kapanma oranı gibi yüzdeleri güvenli hesaplar (bölme hatası korumalı). */
export function safeRatio(numerator: number, denominator: number): RatioResult {
  if (denominator === 0) return { numerator, denominator, ratioPercent: null };
  return { numerator, denominator, ratioPercent: Math.round((numerator / denominator) * 1000) / 10 };
}

/** Bir ISO tarihi diziden gruplamak için "YYYY-MM" ay anahtarı üretir. */
export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function monthLabelOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${AY_ADLARI[m - 1]} ${y}`;
}

/** Belirtilen son N ay için sıralı ay anahtarları üretir (bugünü içeren ay dahil). */
export function lastNMonthKeys(todayIso: string, n: number): string[] {
  const [y, m] = todayIso.split("-").map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(y, m - 1 - i, 1);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}
