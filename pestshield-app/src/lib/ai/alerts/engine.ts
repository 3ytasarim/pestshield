// PestShield AI Command Center — Faz 4 deterministik proaktif uyarı motoru.
//
// LLM bu dosyanın HİÇBİR satırını çalıştırmaz — sadece zaten üretilmiş bir
// AlertInstance'ı açıklayabilir (bkz. system-prompt.ts Faz 4 kuralları).
// Tüm koşullar AiDataProvider üzerinden (Faz 1/2 ile AYNI salt-okunur
// arayüz) okunur; hiçbir yeni ham veri erişimi eklenmez.

import { AI_ROUTES } from "@/lib/ai/routes";
import { comparePeriods, previousPeriodOf } from "@/lib/ai/analysis/period-comparison";
import { ALERT_RULES, ALERT_THRESHOLDS, rulesForRole } from "@/lib/ai/alerts/rules";
import { getAlertByDedupKey, updateAlert, upsertAlert, listAlerts } from "@/lib/ai/alerts/alert-store";
import type { AlertInstance } from "@/lib/ai/alerts/types";
import type { AiDataProvider, AiServiceOccurrence } from "@/lib/ai/providers/data-provider";

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function newId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface DetectedCondition {
  dedupKey: string;
  title: string;
  description: string;
  evidence: string;
  sourceEntityType: AlertInstance["sourceEntityType"];
  sourceEntityId: string | null;
  relatedCustomerId: string | null;
  relatedCustomerName: string | null;
  relatedTechnicianName: string | null;
  navigationHref: string | null;
}

/**
 * Bir koşul kümesini gerçek AlertInstance kayıtlarına dönüştürür — zaten var
 * olan (dedupKey eşleşen) bir uyarı varsa SADECE lastDetectedAt/occurrenceCount
 * günceller, YENİ bir kayıt oluşturmaz (spesifikasyon: "Do not create
 * duplicate alerts on every scheduler run").
 */
function upsertConditions(ruleCode: keyof typeof ALERT_RULES, conditions: DetectedCondition[]) {
  const rule = ALERT_RULES[ruleCode];
  const now = new Date().toISOString();

  for (const c of conditions) {
    const existing = getAlertByDedupKey(c.dedupKey);
    if (existing && existing.status !== "dismissed" && existing.status !== "resolved") {
      updateAlert(existing.id, { lastDetectedAt: now, occurrenceCount: existing.occurrenceCount + 1, description: c.description, evidence: c.evidence });
      continue;
    }
    if (existing && (existing.status === "dismissed" || existing.status === "resolved")) {
      // Kullanıcı zaten kapatmış/çözümlenmiş bir koşulu sessizce yeniden açmaz.
      continue;
    }
    upsertAlert({
      id: newId(),
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleVersion: rule.ruleVersion,
      category: rule.category,
      severity: rule.severity,
      title: c.title,
      description: c.description,
      evidence: c.evidence,
      sourceEntityType: c.sourceEntityType,
      sourceEntityId: c.sourceEntityId,
      relatedCustomerId: c.relatedCustomerId,
      relatedCustomerName: c.relatedCustomerName,
      relatedTechnicianName: c.relatedTechnicianName,
      navigationHref: c.navigationHref,
      firstDetectedAt: now,
      lastDetectedAt: now,
      occurrenceCount: 1,
      status: "active",
      acknowledgedBy: null,
      acknowledgedAt: null,
      dismissedBy: null,
      dismissedAt: null,
      snoozedUntil: null,
      resolvedAt: null,
      deduplicationKey: c.dedupKey,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/** Bir kural için artık geçerli olmayan (dedupKey listede olmayan) aktif/onaylanmış uyarıları "resolved" işaretler (spesifikasyon: "When the condition resolves: Mark the alert resolved"). */
function resolveStale(ruleCode: keyof typeof ALERT_RULES, stillActiveDedupKeys: Set<string>) {
  const now = new Date().toISOString();
  for (const alert of listAlerts()) {
    if (alert.ruleCode !== ruleCode) continue;
    if (alert.status === "resolved" || alert.status === "dismissed") continue;
    if (stillActiveDedupKeys.has(alert.deduplicationKey)) continue;
    updateAlert(alert.id, { status: "resolved", resolvedAt: now });
  }
}

export const ProactiveAlertEngine = {
  /** Tüm etkin kuralları bir kez değerlendirir ve alert-store'u günceller. Dönüş değeri sadece bu çalıştırmada tespit edilen/güncellenen dedupKey'lerdir (test/gözlemlenebilirlik için). */
  async evaluate(provider: AiDataProvider, todayIso: string): Promise<void> {
    const [occurrences, invoices, customers, openRisks, allRisks, correctiveActions] = await Promise.all([
      provider.getServiceOccurrences(),
      provider.getInvoices(),
      provider.getCustomers(),
      provider.getOpenRisks(),
      provider.getAllRisks(),
      provider.getOpenCorrectiveActions(),
    ]);

    const tomorrow = addDaysIso(todayIso, 1);

    evaluateOverdueService(occurrences, todayIso);
    evaluateServiceDueOn(occurrences, todayIso, "service_due_today");
    evaluateServiceDueOn(occurrences, tomorrow, "service_due_tomorrow");
    evaluateUnassignedService(occurrences, todayIso);
    evaluateTechnicianConflicts(occurrences, todayIso);
    evaluateTechnicianOverload(occurrences, todayIso);
    evaluateOverduePayment(invoices);
    evaluatePaymentDueOn(invoices, todayIso, "payment_due_today");
    evaluatePaymentDueOn(invoices, tomorrow, "payment_due_tomorrow");
    evaluateExpiringContracts(customers, todayIso);
    evaluateCriticalRisks(openRisks);
    evaluateUnresolvedCorrectiveActions(correctiveActions);
    evaluateRisingPestActivity(allRisks, todayIso);
  },
};

function evaluateOverdueService(occurrences: AiServiceOccurrence[], todayIso: string) {
  const overdue = occurrences.filter((o) => o.periodDate < todayIso && !o.isCompleted);
  const conditions: DetectedCondition[] = overdue.map((o) => ({
    dedupKey: `overdue_service:${o.occurrenceId}`,
    title: `Gecikmiş servis — ${o.customerName}`,
    description: `${o.customerName} için ${o.periodDate} tarihli "${o.serviceName}" servisi henüz tamamlanmadı.`,
    evidence: `Planlanan tarih: ${o.periodDate}, bugün: ${todayIso}, durum: tamamlanmadı.`,
    sourceEntityType: "occurrence",
    sourceEntityId: o.occurrenceId,
    relatedCustomerId: o.customerId,
    relatedCustomerName: o.customerName,
    relatedTechnicianName: o.personnelName || null,
    navigationHref: AI_ROUTES.services(),
  }));
  upsertConditions("overdue_service", conditions);
  resolveStale("overdue_service", new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateServiceDueOn(occurrences: AiServiceOccurrence[], dateIso: string, ruleCode: "service_due_today" | "service_due_tomorrow") {
  const due = occurrences.filter((o) => o.periodDate === dateIso);
  const conditions: DetectedCondition[] = due.map((o) => ({
    dedupKey: `${ruleCode}:${o.occurrenceId}:${dateIso}`,
    title: `${ruleCode === "service_due_today" ? "Bugün" : "Yarın"} planlanan servis — ${o.customerName}`,
    description: `${o.customerName} için "${o.serviceName}" servisi ${dateIso} tarihinde planlanmış.`,
    evidence: `Planlanan tarih: ${dateIso}, saat: ${o.startTime}–${o.endTime}.`,
    sourceEntityType: "occurrence",
    sourceEntityId: o.occurrenceId,
    relatedCustomerId: o.customerId,
    relatedCustomerName: o.customerName,
    relatedTechnicianName: o.personnelName || null,
    navigationHref: AI_ROUTES.services(),
  }));
  upsertConditions(ruleCode, conditions);
  resolveStale(ruleCode, new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateUnassignedService(occurrences: AiServiceOccurrence[], todayIso: string) {
  const unassigned = occurrences.filter((o) => o.periodDate >= todayIso && !o.personnelName?.trim());
  const conditions: DetectedCondition[] = unassigned.map((o) => ({
    dedupKey: `unassigned_service:${o.occurrenceId}`,
    title: `Atanmamış servis — ${o.customerName}`,
    description: `${o.customerName} için ${o.periodDate} tarihli servis henüz bir teknisyene atanmadı.`,
    evidence: `Planlanan tarih: ${o.periodDate}, atanan personel: yok.`,
    sourceEntityType: "occurrence",
    sourceEntityId: o.occurrenceId,
    relatedCustomerId: o.customerId,
    relatedCustomerName: o.customerName,
    relatedTechnicianName: null,
    navigationHref: AI_ROUTES.services(),
  }));
  upsertConditions("unassigned_service", conditions);
  resolveStale("unassigned_service", new Set(conditions.map((c) => c.dedupKey)));
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function evaluateTechnicianConflicts(occurrences: AiServiceOccurrence[], todayIso: string) {
  const upcoming = occurrences.filter((o) => o.periodDate >= todayIso && o.personnelName?.trim());
  const conditions: DetectedCondition[] = [];
  const seenPairs = new Set<string>();

  for (const a of upcoming) {
    for (const b of upcoming) {
      if (a.occurrenceId >= b.occurrenceId) continue;
      if (a.personnelName !== b.personnelName || a.periodDate !== b.periodDate) continue;
      if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;
      const pairKey = `technician_schedule_conflict:${a.personnelName}:${a.periodDate}:${[a.occurrenceId, b.occurrenceId].sort().join(":")}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      conditions.push({
        dedupKey: pairKey,
        title: `Program çakışması — ${a.personnelName}`,
        description: `${a.personnelName}, ${a.periodDate} tarihinde çakışan saatlerde iki servise atanmış: ${a.customerName} (${a.startTime}–${a.endTime}) ve ${b.customerName} (${b.startTime}–${b.endTime}).`,
        evidence: `Aynı teknisyen, aynı tarih, çakışan saat aralıkları.`,
        sourceEntityType: "technician",
        sourceEntityId: null,
        relatedCustomerId: null,
        relatedCustomerName: null,
        relatedTechnicianName: a.personnelName,
        navigationHref: AI_ROUTES.servicePlanning(),
      });
    }
  }
  upsertConditions("technician_schedule_conflict", conditions);
  resolveStale("technician_schedule_conflict", new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateTechnicianOverload(occurrences: AiServiceOccurrence[], todayIso: string) {
  const upcoming = occurrences.filter((o) => o.periodDate >= todayIso && o.personnelName?.trim());
  const byTechDate = new Map<string, AiServiceOccurrence[]>();
  for (const o of upcoming) {
    const key = `${o.personnelName}:${o.periodDate}`;
    if (!byTechDate.has(key)) byTechDate.set(key, []);
    byTechDate.get(key)!.push(o);
  }

  const conditions: DetectedCondition[] = [];
  for (const [key, list] of byTechDate.entries()) {
    if (list.length <= ALERT_THRESHOLDS.technicianDailyServiceLimit) continue;
    const [technicianName, date] = key.split(":");
    conditions.push({
      dedupKey: `technician_overload:${key}`,
      title: `Teknisyen aşırı yüklenmesi — ${technicianName}`,
      description: `${technicianName}, ${date} tarihinde ${list.length} servise atanmış (günlük limit: ${ALERT_THRESHOLDS.technicianDailyServiceLimit}).`,
      evidence: `${date} için atanmış servis sayısı: ${list.length}.`,
      sourceEntityType: "technician",
      sourceEntityId: null,
      relatedCustomerId: null,
      relatedCustomerName: null,
      relatedTechnicianName: technicianName,
      navigationHref: AI_ROUTES.servicePlanning(),
    });
  }
  upsertConditions("technician_overload", conditions);
  resolveStale("technician_overload", new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateOverduePayment(invoices: Awaited<ReturnType<AiDataProvider["getInvoices"]>>) {
  const overdue = invoices.filter((i) => i.status === "overdue");
  const conditions: DetectedCondition[] = overdue.map((i) => ({
    dedupKey: `overdue_payment:${i.invoiceNo}`,
    title: `Gecikmiş tahsilat — ${i.customerName}`,
    description: `${i.customerName} için ${i.invoiceNo} numaralı, ${i.amount.toLocaleString("tr-TR")} ₺ tutarındaki fatura vadesi geçmiş.`,
    evidence: `Vade tarihi: ${i.dueDate}, tutar: ${i.amount.toLocaleString("tr-TR")} ₺.`,
    sourceEntityType: "invoice",
    sourceEntityId: i.invoiceNo,
    relatedCustomerId: i.customerId,
    relatedCustomerName: i.customerName,
    relatedTechnicianName: null,
    navigationHref: AI_ROUTES.collections(),
  }));
  upsertConditions("overdue_payment", conditions);
  resolveStale("overdue_payment", new Set(conditions.map((c) => c.dedupKey)));
}

function evaluatePaymentDueOn(invoices: Awaited<ReturnType<AiDataProvider["getInvoices"]>>, dateIso: string, ruleCode: "payment_due_today" | "payment_due_tomorrow") {
  const due = invoices.filter((i) => i.status !== "paid" && i.dueDate === dateIso);
  const conditions: DetectedCondition[] = due.map((i) => ({
    dedupKey: `${ruleCode}:${i.invoiceNo}:${dateIso}`,
    title: `${ruleCode === "payment_due_today" ? "Bugün" : "Yarın"} vadesi gelen tahsilat — ${i.customerName}`,
    description: `${i.customerName} için ${i.invoiceNo} numaralı fatura ${dateIso} tarihinde vadesi doluyor.`,
    evidence: `Vade tarihi: ${dateIso}, tutar: ${i.amount.toLocaleString("tr-TR")} ₺.`,
    sourceEntityType: "invoice",
    sourceEntityId: i.invoiceNo,
    relatedCustomerId: i.customerId,
    relatedCustomerName: i.customerName,
    relatedTechnicianName: null,
    navigationHref: AI_ROUTES.collections(),
  }));
  upsertConditions(ruleCode, conditions);
  resolveStale(ruleCode, new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateExpiringContracts(customers: Awaited<ReturnType<AiDataProvider["getCustomers"]>>, todayIso: string) {
  const threshold = addDaysIso(todayIso, ALERT_THRESHOLDS.expiringContractDays);
  const expiring = customers.filter((c) => c.contractEndDate && c.contractEndDate >= todayIso && c.contractEndDate <= threshold);
  const conditions: DetectedCondition[] = expiring.map((c) => ({
    dedupKey: `expiring_contract:${c.customerId}`,
    title: `Süresi dolan sözleşme — ${c.companyName}`,
    description: `${c.companyName} sözleşmesi ${c.contractEndDate} tarihinde sona eriyor.`,
    evidence: `Sözleşme bitiş tarihi: ${c.contractEndDate}, bugün: ${todayIso}.`,
    sourceEntityType: "customer",
    sourceEntityId: c.customerId,
    relatedCustomerId: c.customerId,
    relatedCustomerName: c.companyName,
    relatedTechnicianName: null,
    navigationHref: AI_ROUTES.customerDetail(c.customerId),
  }));
  upsertConditions("expiring_contract", conditions);
  resolveStale("expiring_contract", new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateCriticalRisks(openRisks: Awaited<ReturnType<AiDataProvider["getOpenRisks"]>>) {
  const critical = openRisks.filter((r) => r.status === "critical");
  const conditions: DetectedCondition[] = critical.map((r) => ({
    dedupKey: `critical_risk:${r.id}`,
    title: `Kritik risk — ${r.title}`,
    description: `${r.customerName ? `${r.customerName} için ` : ""}"${r.title}" kritik seviyeli risk kaydı açık durumda.`,
    evidence: `Risk kategorisi: ${r.category}, olasılık×etki skoru: ${r.likelihood * r.impact}.`,
    sourceEntityType: "risk",
    sourceEntityId: r.id,
    relatedCustomerId: r.customerId,
    relatedCustomerName: r.customerName,
    relatedTechnicianName: null,
    navigationHref: AI_ROUTES.riskManagement(),
  }));
  upsertConditions("critical_risk", conditions);
  resolveStale("critical_risk", new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateUnresolvedCorrectiveActions(actions: Awaited<ReturnType<AiDataProvider["getOpenCorrectiveActions"]>>) {
  const overdue = actions.filter((a) => a.overdue);
  const conditions: DetectedCondition[] = overdue.map((a) => ({
    dedupKey: `unresolved_corrective_action:${a.id}`,
    title: `Gecikmiş düzeltici faaliyet — ${a.title}`,
    description: `"${a.title}" düzeltici faaliyeti son tarihi (${a.dueDate}) geçmiş durumda.`,
    evidence: `Son tarih: ${a.dueDate}, sorumlu: ${a.responsible}.`,
    sourceEntityType: "corrective_action",
    sourceEntityId: a.id,
    relatedCustomerId: a.customerId,
    relatedCustomerName: a.customerName,
    relatedTechnicianName: null,
    navigationHref: AI_ROUTES.correctiveActions(),
  }));
  upsertConditions("unresolved_corrective_action", conditions);
  resolveStale("unresolved_corrective_action", new Set(conditions.map((c) => c.dedupKey)));
}

function evaluateRisingPestActivity(allRisks: Awaited<ReturnType<AiDataProvider["getAllRisks"]>>, todayIso: string) {
  const windowStart = addDaysIso(todayIso, -ALERT_THRESHOLDS.risingPestActivityWindowDays);
  const prev = previousPeriodOf({ startDate: windowStart, endDate: todayIso });

  const byCategory = new Map<string, { current: number; previous: number }>();
  for (const r of allRisks) {
    const bucket = byCategory.get(r.category) ?? { current: 0, previous: 0 };
    if (r.reviewDate >= windowStart && r.reviewDate <= todayIso) bucket.current += 1;
    else if (r.reviewDate >= prev.startDate && r.reviewDate <= prev.endDate) bucket.previous += 1;
    byCategory.set(r.category, bucket);
  }

  const conditions: DetectedCondition[] = [];
  for (const [category, counts] of byCategory.entries()) {
    if (counts.previous === 0) continue; // Karşılaştırma için önceki dönem verisi yoksa artış hesaplanamaz.
    const comparison = comparePeriods(counts.current, counts.previous);
    if (comparison.direction !== "up" || comparison.percentChange === null) continue;
    if (comparison.percentChange < ALERT_THRESHOLDS.risingPestActivityMinIncreasePercent) continue;

    conditions.push({
      dedupKey: `rising_pest_activity:${category}:${windowStart}`,
      title: `Artan haşere aktivitesi — ${category}`,
      description: `"${category}" kategorisinde son ${ALERT_THRESHOLDS.risingPestActivityWindowDays} günde risk kaydı sayısı önceki döneme göre %${comparison.percentChange} arttı.`,
      evidence: `Son dönem: ${counts.current} kayıt, önceki dönem: ${counts.previous} kayıt.`,
      sourceEntityType: null,
      sourceEntityId: null,
      relatedCustomerId: null,
      relatedCustomerName: null,
      relatedTechnicianName: null,
      navigationHref: AI_ROUTES.riskManagement(),
    });
  }
  upsertConditions("rising_pest_activity", conditions);
  resolveStale("rising_pest_activity", new Set(conditions.map((c) => c.dedupKey)));
}

export { rulesForRole };
