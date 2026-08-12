// "Risk Tahmini" sayfası ve sohbetteki "get_risk_intelligence_summary" aracı
// AYNI hesaplamayı kullanır (bkz. src/lib/ai/tools/executor.ts) — burada
// deterministik, tekrar kullanılabilir bir fonksiyon olarak ayrıştırılmıştır.

import type { AiDataProvider } from "@/lib/ai/providers/data-provider";
import { comparePeriods } from "@/lib/ai/analysis/period-comparison";
import type { AiDataQuality, AiMetricDelta, AiRiskIntelligenceData, AiRiskRow } from "@/lib/ai/types";

const MAX_ROWS = 20;

function completeQuality(): AiDataQuality {
  return { status: "complete", missingFields: [], limitations: [] };
}

function toDelta(label: string, current: number, previous: number, goodDirection: "up" | "down" = "down"): AiMetricDelta {
  const c = comparePeriods(current, previous);
  return { label, current: c.current, previous: c.previous, absoluteChange: c.absoluteChange, percentChange: c.percentChange, direction: c.direction, note: c.note, goodDirection };
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function buildRiskIntelligenceData(provider: AiDataProvider, todayIso: string): Promise<AiRiskIntelligenceData | null> {
  const [openRisks, allRisks] = await Promise.all([provider.getOpenRisks(), provider.getAllRisks()]);
  const critical = openRisks.filter((r) => r.status === "critical" || r.status === "high");
  const criticalRows: AiRiskRow[] = critical
    .map((r) => ({ title: r.title, category: r.category, score: r.likelihood * r.impact, level: r.status, customerName: r.customerName, owner: r.owner }))
    .sort((a, b) => b.score - a.score);

  const distMap = new Map<string, number>();
  for (const r of openRisks) distMap.set(r.category, (distMap.get(r.category) ?? 0) + 1);
  const distribution = [...distMap.entries()].map(([category, count]) => ({ category, count }));

  const windowStart = addDaysIso(todayIso, -60);
  const prevWindowStart = addDaysIso(windowStart, -60);
  const recent = allRisks.filter((r) => r.reviewDate >= windowStart && r.reviewDate <= todayIso).length;
  const prior = allRisks.filter((r) => r.reviewDate >= prevWindowStart && r.reviewDate < windowStart).length;
  const comparison = toDelta("Son 60 gün risk kaydı sayısı", recent, prior, "down");

  const recommendations: string[] = [];
  if (critical.length > 0) recommendations.push("AI önerisi: Açık kritik/yüksek risklerin kök neden değerlendirmesi ve mitigasyon planı önceliklendirilebilir.");
  if (comparison.direction === "up" && comparison.percentChange !== null) recommendations.push("AI önerisi: Artan risk kaydı sıklığı, ilgili lokasyonlarda ek kontrol sıklığının değerlendirilmesini gerektirebilir.");
  if (recommendations.length === 0) recommendations.push("Şu an ek bir öneri bulunmuyor.");

  if (critical.length === 0 && distribution.length === 0) return null;

  return {
    criticalRisks: criticalRows.slice(0, MAX_ROWS),
    distribution,
    comparison,
    recommendations,
    dataQuality: prior === 0 ? { status: "partial", missingFields: [], limitations: ["Önceki 60 günlük dönem için kayıt bulunamadı."] } : completeQuality(),
  };
}
