// PestShield AI Command Center — Faz 2 "Operasyon Özet Raporu" veri toplayıcı.
//
// Bu fonksiyon SADECE AiDataProvider üzerinden okur (Faz 1 mimari kuralına
// sadık) ve tamamen deterministiktir — hiçbir LLM çağrısı içermez. Hem
// sohbet paneli (generate_operational_report tool'u) hem de PDF/Excel
// export'ları AYNI bu fonksiyonun ürettiği veriyi kullanır, böylece rapor
// içeriği ile sohbette gösterilen özet arasında tutarsızlık olmaz.

import type { AiDataProvider } from "@/lib/ai/providers/data-provider";
import { comparePeriods, lastNMonthKeys, monthKeyOf, monthLabelOf } from "@/lib/ai/analysis/period-comparison";
import type { AiChartSpec, AiDataQuality, AiKpiItem, AiMetricDelta, AiRiskDistributionSlice } from "@/lib/ai/types";

export interface AiOperationalReportData {
  scope: "company" | "customer";
  entityName: string | null;
  period: { from: string; to: string };
  kpis: AiKpiItem[];
  serviceTrendChart: AiChartSpec;
  comparison: AiMetricDelta[];
  riskDistribution: AiRiskDistributionSlice[];
  criticalRiskCount: number;
  expectedCollectionTotal: number;
  overdueCollectionTotal: number;
  overdueCollectionCount: number;
  dataQuality: AiDataQuality;
  sourceRecordCount: number;
}

export interface BuildReportParams {
  provider: AiDataProvider;
  todayIso: string;
  scope: "company" | "customer";
  customerId?: string;
  entityName?: string | null;
  months: number;
}

export async function buildOperationalReportData(params: BuildReportParams): Promise<AiOperationalReportData> {
  const { provider, todayIso, scope, customerId, months } = params;
  const monthKeys = lastNMonthKeys(todayIso, Math.max(1, Math.min(months, 24)));
  const periodFrom = `${monthKeys[0]}-01`;

  const [occurrencesAll, invoicesAll, risksAll] = await Promise.all([
    provider.getServiceOccurrences(),
    provider.getInvoices(),
    provider.getAllRisks(),
  ]);

  const occurrences = scope === "customer" && customerId ? occurrencesAll.filter((o) => o.customerId === customerId) : occurrencesAll;
  const invoices = scope === "customer" && customerId ? invoicesAll.filter((i) => i.customerId === customerId) : invoicesAll;
  const risks = scope === "customer" && customerId ? risksAll.filter((r) => r.customerId === customerId) : risksAll;

  const inPeriod = occurrences.filter((o) => o.periodDate >= periodFrom && o.periodDate <= todayIso);

  // Aylık servis sayısı trendi
  const countsByMonth = new Map<string, number>();
  for (const key of monthKeys) countsByMonth.set(key, 0);
  for (const o of inPeriod) {
    const key = monthKeyOf(o.periodDate);
    if (countsByMonth.has(key)) countsByMonth.set(key, (countsByMonth.get(key) ?? 0) + 1);
  }
  const serviceTrendChart: AiChartSpec = {
    chartType: "line",
    title: "Aylık Servis Sayısı Trendi",
    series: [{ name: "Servis Sayısı", points: monthKeys.map((k) => ({ label: monthLabelOf(k), value: countsByMonth.get(k) ?? 0 })) }],
  };

  // Dönem karşılaştırması: son ay vs bir önceki ay
  const lastMonthKey = monthKeys.at(-1)!;
  const secondLastMonthKey = monthKeys.length > 1 ? monthKeys.at(-2)! : null;
  const comparison: AiMetricDelta[] = [];
  if (secondLastMonthKey) {
    const c = comparePeriods(countsByMonth.get(lastMonthKey) ?? 0, countsByMonth.get(secondLastMonthKey) ?? 0);
    comparison.push({
      label: `${monthLabelOf(lastMonthKey)} servis sayısı (önceki aya göre)`,
      current: c.current,
      previous: c.previous,
      absoluteChange: c.absoluteChange,
      percentChange: c.percentChange,
      direction: c.direction,
      note: c.note,
      goodDirection: "up",
    });
  }

  const completed = inPeriod.filter((o) => o.isCompleted).length;
  const overdue = inPeriod.filter((o) => o.periodDate < todayIso && !o.isCompleted).length;

  const rangeStart = periodFrom;
  const invoicesInPeriod = invoices.filter((i) => i.dueDate >= rangeStart && i.dueDate <= todayIso);
  const expected = invoicesInPeriod.filter((i) => i.status !== "paid");
  const overdueInvoices = invoicesInPeriod.filter((i) => i.status === "overdue");
  const expectedCollectionTotal = expected.reduce((s, i) => s + i.amount, 0);
  const overdueCollectionTotal = overdueInvoices.reduce((s, i) => s + i.amount, 0);

  const distMap = new Map<string, number>();
  const openRisks = risks.filter((r) => r.status !== "closed");
  for (const r of openRisks) distMap.set(r.category, (distMap.get(r.category) ?? 0) + 1);
  const riskDistribution: AiRiskDistributionSlice[] = [...distMap.entries()].map(([category, count]) => ({ category, count }));
  const criticalRiskCount = openRisks.filter((r) => r.likelihood * r.impact >= 9).length;

  const kpis: AiKpiItem[] = [
    { label: "Toplam Servis", value: inPeriod.length, tone: "neutral" },
    { label: "Tamamlanan", value: completed, tone: "good" },
    { label: "Gecikmiş", value: overdue, tone: overdue > 0 ? "critical" : "good" },
    { label: "Kritik Risk", value: criticalRiskCount, tone: criticalRiskCount > 0 ? "critical" : "good" },
    { label: "Beklenen Tahsilat", value: `${expectedCollectionTotal.toLocaleString("tr-TR")} ₺`, tone: "neutral" },
    { label: "Gecikmiş Tahsilat", value: `${overdueCollectionTotal.toLocaleString("tr-TR")} ₺`, tone: overdueCollectionTotal > 0 ? "warning" : "good" },
  ];

  const sourceRecordCount = inPeriod.length + invoicesInPeriod.length + openRisks.length;
  const dataQuality: AiDataQuality =
    sourceRecordCount === 0
      ? { status: "insufficient", missingFields: [], limitations: ["Seçilen dönemde yeterli kayıt bulunamadı."] }
      : monthKeys.length < 2
        ? { status: "partial", missingFields: [], limitations: ["Karşılaştırma için yeterli önceki dönem verisi yok."] }
        : { status: "complete", missingFields: [], limitations: [] };

  return {
    scope,
    entityName: params.entityName ?? null,
    period: { from: periodFrom, to: todayIso },
    kpis,
    serviceTrendChart,
    comparison,
    riskDistribution,
    criticalRiskCount,
    expectedCollectionTotal,
    overdueCollectionTotal,
    overdueCollectionCount: overdueInvoices.length,
    dataQuality,
    sourceRecordCount,
  };
}
