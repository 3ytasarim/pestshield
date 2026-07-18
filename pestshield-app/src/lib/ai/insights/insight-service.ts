// PestShield AI Command Center — Faz 2 proaktif operasyonel içgörü motoru.
//
// AiOperationalInsightService, panel açıldığında veya kullanıcı "Bugün
// dikkat etmem gerekenler" gibi bir istek gönderdiğinde çağrılır. SADECE
// gerçek, mevcut veriden (AiDataProvider) türetilen, zayıf/yetersiz
// kanıta dayanmayan içgörüler üretir — hiçbir içgörü "tahmin" değildir,
// her biri somut bir kayıt kümesine dayanır (bkz. `evidence` alanı).

import type { AiDataProvider } from "@/lib/ai/providers/data-provider";
import { AI_ROUTES } from "@/lib/ai/routes";
import type { AiInsightItem, InsightSeverity } from "@/lib/ai/types";

const SEVERITY_ORDER: Record<InsightSeverity, number> = { critical: 0, high: 1, warning: 2, info: 3 };
const MAX_INSIGHTS = 5;

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function generateOperationalInsights(provider: AiDataProvider, todayIso: string): Promise<AiInsightItem[]> {
  const [occurrences, invoices, risks, correctiveActions] = await Promise.all([
    provider.getServiceOccurrences(),
    provider.getInvoices(),
    provider.getOpenRisks(),
    provider.getOpenCorrectiveActions(),
  ]);

  const insights: AiInsightItem[] = [];
  const now = new Date().toISOString();

  const overdueServices = occurrences.filter((o) => o.periodDate < todayIso && !o.isCompleted);
  if (overdueServices.length > 0) {
    insights.push({
      id: "insight-overdue-service",
      type: "overdue_service",
      severity: overdueServices.length >= 5 ? "critical" : "high",
      title: "Gecikmiş servisler var",
      description: `${overdueServices.length} servis planlanan tarihi geçmiş durumda ve henüz tamamlanmamış.`,
      evidence: `Kaynak: ${overdueServices.length} gecikmiş servis kaydı.`,
      sourceRecordCount: overdueServices.length,
      navigationAction: { label: "Servisleri Aç", href: AI_ROUTES.services() },
      createdAt: now,
    });
  }

  const upcomingUnassigned = occurrences.filter((o) => o.periodDate >= todayIso && o.periodDate <= addDaysIso(todayIso, 3) && !o.personnelName?.trim());
  if (upcomingUnassigned.length > 0) {
    insights.push({
      id: "insight-unassigned-service",
      type: "unassigned_service",
      severity: "warning",
      title: "Atanmamış servisler yaklaşıyor",
      description: `Önümüzdeki 3 gün içinde ${upcomingUnassigned.length} servis henüz bir teknisyene atanmamış.`,
      evidence: `Kaynak: ${upcomingUnassigned.length} atanmamış servis kaydı.`,
      sourceRecordCount: upcomingUnassigned.length,
      navigationAction: { label: "Servisleri Aç", href: AI_ROUTES.services() },
      createdAt: now,
    });
  }

  const overduePayments = invoices.filter((i) => i.status === "overdue");
  if (overduePayments.length > 0) {
    const total = overduePayments.reduce((s, i) => s + i.amount, 0);
    insights.push({
      id: "insight-overdue-payment",
      type: "overdue_payment",
      severity: overduePayments.length >= 5 ? "high" : "warning",
      title: "Gecikmiş tahsilatlar var",
      description: `${overduePayments.length} fatura vadesi geçmiş, toplam ${total.toLocaleString("tr-TR")} ₺.`,
      evidence: `Kaynak: ${overduePayments.length} vadesi geçmiş fatura kaydı.`,
      sourceRecordCount: overduePayments.length,
      navigationAction: { label: "Tahsilatlar'da Aç", href: AI_ROUTES.collections() },
      createdAt: now,
    });
  }

  const criticalRisks = risks.filter((r) => r.status === "critical" || r.status === "high");
  if (criticalRisks.length > 0) {
    insights.push({
      id: "insight-critical-risk",
      type: "rising_risk",
      severity: "critical",
      title: "Açık kritik riskler var",
      description: `${criticalRisks.length} açık kritik/yüksek risk kaydı bulunuyor.`,
      evidence: `Kaynak: ${criticalRisks.length} açık kritik/yüksek risk kaydı.`,
      sourceRecordCount: criticalRisks.length,
      navigationAction: { label: "Risk Yönetimi'nde Aç", href: AI_ROUTES.riskManagement() },
      createdAt: now,
    });
  }

  const overdueCapa = correctiveActions.filter((c) => c.overdue);
  if (overdueCapa.length > 0) {
    insights.push({
      id: "insight-open-corrective-action",
      type: "open_corrective_action",
      severity: "warning",
      title: "Gecikmiş düzeltici faaliyetler var",
      description: `${overdueCapa.length} düzeltici/önleyici faaliyet son tarihini geçmiş durumda.`,
      evidence: `Kaynak: ${overdueCapa.length} gecikmiş CAPA kaydı.`,
      sourceRecordCount: overdueCapa.length,
      navigationAction: { label: "Düzeltici Faaliyetler'de Aç", href: AI_ROUTES.correctiveActions() },
      createdAt: now,
    });
  }

  const expiringContracts = (await provider.getCustomers()).filter((c) => {
    if (!c.contractEndDate) return false;
    return c.contractEndDate >= todayIso && c.contractEndDate <= addDaysIso(todayIso, 30);
  });
  if (expiringContracts.length > 0) {
    insights.push({
      id: "insight-expiring-contract",
      type: "expiring_contract",
      severity: "info",
      title: "Yaklaşan sözleşme yenilemeleri",
      description: `${expiringContracts.length} müşterinin sözleşmesi önümüzdeki 30 gün içinde sona eriyor.`,
      evidence: `Kaynak: ${expiringContracts.length} müşteri kaydı.`,
      sourceRecordCount: expiringContracts.length,
      navigationAction: { label: "Sözleşmeleri Aç", href: AI_ROUTES.contracts() },
      createdAt: now,
    });
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, MAX_INSIGHTS);
}
