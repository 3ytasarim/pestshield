// PestShield AI Command Center — deterministik Türkçe tarih ifadesi çözümleyici.
//
// Bu modül LLM'e bağımlı DEĞİLDİR — saf, test edilebilir bir fonksiyon.
// Amaç: temel tarih ifadelerinin doğruluğunu tamamen modelin serbest
// metin çıktısına bırakmamak. /api/ai/chat, kullanıcı mesajını modele
// göndermeden önce bu fonksiyonla bir "tarih ipucu" çıkarır ve sistem
// promptuna ekler — model hâlâ nihai tool çağrısını yapar, ama tarih
// aritmetiği için kendi hesaplamasına değil bu deterministik sonuca
// güvenmesi istenir.

export interface ResolvedDateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const AY_ADLARI: Record<string, number> = {
  ocak: 0, şubat: 1, subat: 1, mart: 2, nisan: 3, mayıs: 4, mayis: 4, haziran: 5,
  temmuz: 6, ağustos: 7, agustos: 7, eylül: 8, eylul: 8, ekim: 9, kasım: 10, kasim: 10, aralık: 11, aralik: 11,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** Verilen zaman diliminde "bugün"ün yerel Y-A-G değerini saf bir Date (yerel saat 00:00) olarak döndürür. */
export function todayInTimeZone(now: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Pazar
  const diff = day === 0 ? -6 : 1 - day; // Pazartesi'ye git
  return addDays(d, diff);
}

/**
 * Metin içinde geçen Türkçe göreli/mutlak tarih ifadesini bugüne göre çözer.
 * Eşleşme yoksa null döner (metin başka bir tarih ifadesi içermiyor olabilir).
 */
export function parseTurkishDateExpression(text: string, now: Date, timeZone = "Europe/Istanbul"): ResolvedDateRange | null {
  const q = text.toLocaleLowerCase("tr").trim();
  const today = todayInTimeZone(now, timeZone);

  if (/\bbugün\b/.test(q)) {
    return { startDate: toIso(today), endDate: toIso(today), label: "bugün" };
  }
  if (/\byarın\b/.test(q)) {
    const d = addDays(today, 1);
    return { startDate: toIso(d), endDate: toIso(d), label: "yarın" };
  }
  if (/\bdün\b/.test(q)) {
    const d = addDays(today, -1);
    return { startDate: toIso(d), endDate: toIso(d), label: "dün" };
  }
  if (/\bgelecek hafta\b/.test(q)) {
    const start = addDays(startOfWeek(today), 7);
    const end = addDays(start, 6);
    return { startDate: toIso(start), endDate: toIso(end), label: "gelecek hafta" };
  }
  if (/\bgeçen hafta\b|\bgecen hafta\b/.test(q)) {
    const start = addDays(startOfWeek(today), -7);
    const end = addDays(start, 6);
    return { startDate: toIso(start), endDate: toIso(end), label: "geçen hafta" };
  }
  if (/\bbu hafta\b/.test(q)) {
    const start = startOfWeek(today);
    const end = addDays(start, 6);
    return { startDate: toIso(start), endDate: toIso(end), label: "bu hafta" };
  }
  if (/\bgelecek ay\b/.test(q)) {
    const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    return { startDate: toIso(start), endDate: toIso(end), label: "gelecek ay" };
  }
  if (/\bgeçen ay\b|\bgecen ay\b/.test(q)) {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: toIso(start), endDate: toIso(end), label: "geçen ay" };
  }
  if (/\bbu ay\b/.test(q)) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { startDate: toIso(start), endDate: toIso(end), label: "bu ay" };
  }
  if (/\bgeçen yıl\b|\bgecen yil\b/.test(q)) {
    const start = new Date(today.getFullYear() - 1, 0, 1);
    const end = new Date(today.getFullYear() - 1, 11, 31);
    return { startDate: toIso(start), endDate: toIso(end), label: "geçen yıl" };
  }
  if (/\byıl başından beri\b|\byil basindan beri\b/.test(q)) {
    const start = new Date(today.getFullYear(), 0, 1);
    return { startDate: toIso(start), endDate: toIso(today), label: "yıl başından beri" };
  }
  if (/\bson çeyrek\b|\bson ceyrek\b/.test(q)) {
    const currentQuarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const start = new Date(today.getFullYear(), currentQuarterStartMonth - 3, 1);
    const end = new Date(today.getFullYear(), currentQuarterStartMonth, 0);
    return { startDate: toIso(start), endDate: toIso(end), label: "son çeyrek" };
  }

  const nextNDays = q.match(/önümüzdeki\s+(\d+)\s+gün/) ?? q.match(/onumuzdeki\s+(\d+)\s+gun/);
  if (nextNDays) {
    const n = Math.max(1, Math.min(365, Number(nextNDays[1])));
    const end = addDays(today, n);
    return { startDate: toIso(today), endDate: toIso(end), label: `önümüzdeki ${n} gün` };
  }

  const lastNDays = q.match(/son\s+(\d+)\s+gün/) ?? q.match(/son\s+(\d+)\s+gun/);
  if (lastNDays) {
    const n = Math.max(1, Math.min(365, Number(lastNDays[1])));
    const start = addDays(today, -n);
    return { startDate: toIso(start), endDate: toIso(today), label: `son ${n} gün` };
  }

  const lastNMonths = q.match(/son\s+(\d+)\s+ay/);
  if (lastNMonths) {
    const n = Math.max(1, Math.min(36, Number(lastNMonths[1])));
    const start = new Date(today.getFullYear(), today.getMonth() - n + 1, 1);
    return { startDate: toIso(start), endDate: toIso(today), label: `son ${n} ay` };
  }

  // "14 Temmuz 2026" veya "14 Temmuz"
  const dayMonthYear = q.match(/\b(\d{1,2})\s+([a-zçğıöşü]+)\s*(\d{4})?\b/);
  if (dayMonthYear) {
    const day = Number(dayMonthYear[1]);
    const monthKey = dayMonthYear[2];
    const month = AY_ADLARI[monthKey];
    if (month !== undefined && day >= 1 && day <= 31) {
      const year = dayMonthYear[3] ? Number(dayMonthYear[3]) : today.getFullYear();
      const d = new Date(year, month, day);
      return { startDate: toIso(d), endDate: toIso(d), label: toIso(d) };
    }
  }

  // "Temmuz 2027" (sadece ay + yıl — rapor/özet sorguları için)
  const monthYear = q.match(/\b([a-zçğıöşü]+)\s+(\d{4})\b/);
  if (monthYear) {
    const month = AY_ADLARI[monthYear[1]];
    if (month !== undefined) {
      const year = Number(monthYear[2]);
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { startDate: toIso(start), endDate: toIso(end), label: `${monthYear[1]} ${year}` };
    }
  }

  return null;
}
