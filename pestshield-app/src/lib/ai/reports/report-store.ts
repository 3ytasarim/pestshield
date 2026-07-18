// PestShield AI Command Center — Faz 2 rapor geçmişi.
//
// Mimari not: Faz 1'deki conversation-store.ts ile aynı sınırlama geçerli
// — bu uygulamada rapor metaverisi için sunucu tarafı persistence yok,
// bu yüzden kullanıcı bazlı bir anahtarla tarayıcı localStorage'ında
// tutulur. Rapor DOSYALARI (PDF/Excel) hiç localStorage'a yazılmaz
// (base64 olarak bile) — PDF, kullanıcı "PDF İndir"e bastığında anlık
// olarak yeniden render edilir (bkz. src/lib/pdf/ai-operational-report.ts).
// localStorage'da sadece rapor METAVERİSİ (başlık, dönem, KPI özeti,
// durum) tutulur.

import type { ReportMetadata } from "@/lib/ai/reports/types";

const STORAGE_PREFIX = "pestshield.ai.reports.";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function listReports(userId: string): ReportMetadata[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const all = raw ? (JSON.parse(raw) as ReportMetadata[]) : [];
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

function saveAll(userId: string, reports: ReportMetadata[]) {
  if (typeof window === "undefined") return;
  // En fazla son 30 rapor metaverisi tutulur (sınırsız büyümeyi önlemek için).
  window.localStorage.setItem(storageKey(userId), JSON.stringify(reports.slice(0, 30)));
}

export function saveReport(userId: string, report: ReportMetadata) {
  const all = listReports(userId).filter((r) => r.id !== report.id);
  saveAll(userId, [report, ...all]);
}

export function getReport(userId: string, id: string): ReportMetadata | null {
  return listReports(userId).find((r) => r.id === id) ?? null;
}

export function deleteReport(userId: string, id: string) {
  saveAll(userId, listReports(userId).filter((r) => r.id !== id));
}
