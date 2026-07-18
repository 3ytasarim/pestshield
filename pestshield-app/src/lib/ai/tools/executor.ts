// PestShield AI Command Center — tool çalıştırma katmanı.
//
// Bu katman SADECE AiDataProvider arayüzünü kullanır — hiçbir mock/store
// modülünü doğrudan içe aktarmaz. Böylece `LocalStorageAiDataProvider`
// yerine ileride `PrismaAiDataProvider` verildiğinde bu dosyanın tek
// satırı değişmez (bkz. src/lib/ai/providers/data-provider.ts).
//
// Faz 1 kesinlikle salt okunurdur: bu dosyada hiçbir yazma/güncelleme/
// silme işlemi yoktur, sadece filtreleme/toplama/formatlama.

import type {
  AiCustomerRecord,
  AiDataProvider,
  AiServiceOccurrence,
} from "@/lib/ai/providers/data-provider";
import { AI_ROUTES } from "@/lib/ai/routes";
import { comparePeriods, lastNMonthKeys, monthKeyOf, monthLabelOf, previousPeriodOf, safeRatio } from "@/lib/ai/analysis/period-comparison";
import { computeAuditReadiness } from "@/lib/ai/analysis/audit-readiness";
import { buildOperationalReportData } from "@/lib/ai/reports/operational-report-builder";
import {
  buildAssignTechnicianProposal,
  buildCreateFollowupTaskProposal,
  buildCreateServiceProposal,
  buildPrepareEmailProposal,
  buildRescheduleServiceProposal,
  buildSendWhatsAppMessageProposal,
} from "@/lib/ai/actions/proposal-builder";
import type {
  AiAuditIntelligenceData,
  AiChartSpec,
  AiContractRow,
  AiCorrectiveActionRow,
  AiCustomerCard,
  AiCustomerListItem,
  AiDataQuality,
  AiKpiItem,
  AiMetricDelta,
  AiOperationalIntelligenceData,
  AiPaymentRow,
  AiPeriodComparisonData,
  AiRiskIntelligenceData,
  AiRiskRow,
  AiServiceRow,
  AiTechnicianIntelligenceData,
  AiTechnicianPerformanceRow,
  AiTechnicianScheduleRow,
  AiTechnicianWorkloadRow,
  AiToolName,
  AiToolResult,
  AiTrendAnalysisData,
} from "@/lib/ai/types";

const MAX_ROWS = 20;

function completeQuality(): AiDataQuality {
  return { status: "complete", missingFields: [], limitations: [] };
}

function toDelta(label: string, current: number, previous: number, goodDirection: "up" | "down" = "down"): AiMetricDelta {
  const c = comparePeriods(current, previous);
  return { label, current: c.current, previous: c.previous, absoluteChange: c.absoluteChange, percentChange: c.percentChange, direction: c.direction, note: c.note, goodDirection };
}

function toServiceRow(o: AiServiceOccurrence, todayIso: string): AiServiceRow {
  const status: AiServiceRow["status"] = o.isCompleted ? "tamamlandi" : o.periodDate < todayIso ? "gecikti" : "bekliyor";
  return {
    occurrenceId: o.occurrenceId,
    customerId: o.customerId,
    customerName: o.customerName,
    serviceName: o.serviceName,
    personnelName: o.personnelName,
    periodDate: o.periodDate,
    startTime: o.startTime,
    endTime: o.endTime,
    status,
  };
}

function resolveCustomer(customers: AiCustomerRecord[], name: string): { customer: AiCustomerRecord | null; candidates: AiCustomerRecord[] } {
  const q = name.trim().toLocaleLowerCase("tr");
  const matches = customers.filter((c) => c.companyName.toLocaleLowerCase("tr").includes(q));
  if (matches.length === 1) return { customer: matches[0], candidates: [] };
  if (matches.length > 1) return { customer: null, candidates: matches };
  return { customer: null, candidates: [] };
}

function emptyState(message: string): AiToolResult {
  return { responseType: "empty_state", message, source: { recordCount: 0 } };
}

function clarification(candidates: AiCustomerRecord[]): AiToolResult {
  return {
    responseType: "clarification",
    message: `Bu isimle birden fazla müşteri buldum (${candidates.length}). Hangisini kastettiniz?`,
    candidates: candidates.map((c) => ({ customerId: c.customerId, companyName: c.companyName, city: c.city })),
    source: { recordCount: candidates.length },
  };
}

function customerCard(customer: AiCustomerRecord): AiCustomerCard {
  return {
    customerId: customer.customerId,
    companyName: customer.companyName,
    sector: customer.sector,
    city: customer.city,
    status: customer.status,
    riskLevel: customer.riskLevel,
    pendingCollection: customer.pendingCollection,
    contractEndDate: customer.contractEndDate,
    branchCount: customer.branchCount,
  };
}

export async function executeAiTool(
  provider: AiDataProvider,
  toolName: AiToolName,
  params: Record<string, unknown>,
  todayIso: string,
  actionContext?: { userId: string; role: string },
): Promise<AiToolResult> {
  switch (toolName) {
    case "get_today_summary": {
      const [occurrences, invoices] = await Promise.all([provider.getServiceOccurrences(), provider.getInvoices()]);
      const todays = occurrences.filter((o) => o.periodDate === todayIso);
      const gecikti = occurrences.filter((o) => o.periodDate < todayIso && !o.isCompleted);
      const unassigned = todays.filter((o) => !o.personnelName?.trim());
      const paymentsToday = invoices.filter((i) => i.status !== "paid" && i.dueDate === todayIso);
      const kpis: AiKpiItem[] = [
        { label: "Bugünkü Servis", value: todays.length, tone: "neutral", action: { label: "Tümünü Görüntüle", href: AI_ROUTES.services() } },
        { label: "Gecikmiş Servis", value: gecikti.length, tone: gecikti.length > 0 ? "critical" : "good" },
        { label: "Atanmamış", value: unassigned.length, tone: unassigned.length > 0 ? "warning" : "good" },
        { label: "Bugün Beklenen Tahsilat", value: paymentsToday.length, tone: "neutral", action: { label: "Tahsilatlar'da Aç", href: AI_ROUTES.collections() } },
      ];
      return {
        responseType: "summary",
        message: `Bugün için ${todays.length} servis planlandı. ${gecikti.length} servis gecikmiş, ${unassigned.length} servis henüz atanmamış ve ${paymentsToday.length} tahsilat bekleniyor.`,
        kpis,
        source: { dateFrom: todayIso, dateTo: todayIso, recordCount: todays.length },
      };
    }

    case "get_dashboard_summary": {
      const [occurrences, invoices, risks] = await Promise.all([provider.getServiceOccurrences(), provider.getInvoices(), provider.getOpenRisks()]);
      const tomorrow = addDaysIso(todayIso, 1);
      const weekEnd = addDaysIso(todayIso, 7);
      const todays = occurrences.filter((o) => o.periodDate === todayIso);
      const tomorrows = occurrences.filter((o) => o.periodDate === tomorrow);
      const thisWeek = occurrences.filter((o) => o.periodDate >= todayIso && o.periodDate <= weekEnd);
      const overdue = occurrences.filter((o) => o.periodDate < todayIso && !o.isCompleted);
      const overduePayments = invoices.filter((i) => i.status === "overdue");
      const criticalRisks = risks.filter((r) => r.status === "critical" || r.status === "high");
      const kpis: AiKpiItem[] = [
        { label: "Bugün", value: todays.length, action: { label: "Servisleri Aç", href: AI_ROUTES.services() } },
        { label: "Yarın", value: tomorrows.length },
        { label: "Bu Hafta", value: thisWeek.length },
        { label: "Gecikmiş Servis", value: overdue.length, tone: overdue.length > 0 ? "critical" : "good" },
        { label: "Vadesi Geçen Ödeme", value: overduePayments.length, tone: overduePayments.length > 0 ? "warning" : "good", action: { label: "Tahsilatlar'da Aç", href: AI_ROUTES.collections() } },
        { label: "Kritik Risk", value: criticalRisks.length, tone: criticalRisks.length > 0 ? "critical" : "good", action: { label: "Risk Yönetimi'nde Aç", href: AI_ROUTES.riskManagement() } },
      ];
      return {
        responseType: "kpi_grid",
        message: `Genel operasyon özeti: bugün ${todays.length}, yarın ${tomorrows.length}, bu hafta toplam ${thisWeek.length} servis planlandı.`,
        kpis,
        source: { dateFrom: todayIso, dateTo: weekEnd, recordCount: thisWeek.length },
      };
    }

    case "get_services_by_date": {
      const date = String(params.date ?? "");
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences.filter((o) => o.periodDate === date).map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState(`${date} tarihinde planlanmış servis bulunamadı.`);
      return {
        responseType: "service_list",
        message: `${date} tarihinde toplam ${rows.length} servis bulunuyor.`,
        summary: { total: rows.length, gecikti: rows.filter((r) => r.status === "gecikti").length },
        services: rows.slice(0, MAX_ROWS),
        source: { dateFrom: date, dateTo: date, recordCount: rows.length },
      };
    }

    case "get_services_by_date_range": {
      const startDate = String(params.startDate ?? "");
      const endDate = String(params.endDate ?? "");
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences
        .filter((o) => o.periodDate >= startDate && o.periodDate <= endDate)
        .sort((a, b) => (a.periodDate < b.periodDate ? -1 : 1))
        .map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState(`${startDate} – ${endDate} aralığında servis bulunamadı.`);
      return {
        responseType: "service_list",
        message: `${startDate} – ${endDate} aralığında toplam ${rows.length} servis bulunuyor.`,
        summary: { total: rows.length },
        services: rows.slice(0, MAX_ROWS),
        source: { dateFrom: startDate, dateTo: endDate, recordCount: rows.length },
      };
    }

    case "get_overdue_services":
    case "get_overdue_periodic_services": {
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences
        .filter((o) => o.periodDate < todayIso && !o.isCompleted)
        .sort((a, b) => (a.periodDate < b.periodDate ? -1 : 1))
        .map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState("Geciken servis/periyot kaydı bulunamadı — her şey güncel görünüyor.");
      const responseType = toolName === "get_overdue_periodic_services" ? "periodic_service_list" : "service_list";
      return {
        responseType,
        message: `Planlanan tarihi geçmiş ${rows.length} servis/periyot kaydı var.`,
        summary: { total: rows.length },
        services: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    case "get_incomplete_services": {
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences
        .filter((o) => !o.isCompleted)
        .sort((a, b) => (a.periodDate < b.periodDate ? -1 : 1))
        .map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState("Tamamlanmamış servis bulunamadı.");
      return {
        responseType: "service_list",
        message: `${rows.length} servis henüz tamamlanmamış (EK-1 formu eksik).`,
        summary: { total: rows.length },
        services: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    case "get_unassigned_services": {
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences
        .filter((o) => !o.personnelName?.trim())
        .sort((a, b) => (a.periodDate < b.periodDate ? -1 : 1))
        .map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState("Atanmamış servis bulunamadı.");
      return {
        responseType: "service_list",
        message: `${rows.length} servis henüz bir personele atanmamış.`,
        summary: { total: rows.length },
        services: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    case "get_periodic_services_by_date": {
      const date = String(params.date ?? "");
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences.filter((o) => o.periodDate === date).map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState(`${date} tarihinde planlanmış periyodik uygulama bulunamadı.`);
      return {
        responseType: "periodic_service_list",
        message: `${date} tarihinde ${rows.length} periyodik uygulama planlanmış.`,
        summary: { total: rows.length },
        services: rows.slice(0, MAX_ROWS),
        source: { dateFrom: date, dateTo: date, recordCount: rows.length },
      };
    }

    case "get_upcoming_periodic_services": {
      const days = Number(params.days ?? 7);
      const end = addDaysIso(todayIso, Math.max(1, Math.min(days, 90)));
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences
        .filter((o) => o.periodDate >= todayIso && o.periodDate <= end)
        .sort((a, b) => (a.periodDate < b.periodDate ? -1 : 1))
        .map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState(`Önümüzdeki ${days} gün içinde planlanmış periyodik uygulama bulunamadı.`);
      return {
        responseType: "periodic_service_list",
        message: `Önümüzdeki ${days} gün içinde ${rows.length} periyodik uygulama planlanmış.`,
        summary: { total: rows.length },
        services: rows.slice(0, MAX_ROWS),
        source: { dateFrom: todayIso, dateTo: end, recordCount: rows.length },
      };
    }

    case "get_expected_payments": {
      const startDate = String(params.startDate ?? "");
      const endDate = String(params.endDate ?? "");
      const invoices = await provider.getInvoices();
      const rows: AiPaymentRow[] = invoices
        .filter((i) => i.status !== "paid" && i.dueDate >= startDate && i.dueDate <= endDate)
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
        .map((i) => ({ customerName: i.customerName, invoiceNo: i.invoiceNo, amount: i.amount, dueDate: i.dueDate, status: i.status }));
      if (rows.length === 0) return emptyState(`${startDate} – ${endDate} aralığında beklenen ödeme bulunamadı.`);
      const total = rows.reduce((s, r) => s + r.amount, 0);
      return {
        responseType: "payment_table",
        message: `${startDate} – ${endDate} aralığında ${rows.length} ödeme bekleniyor, toplam ${total.toLocaleString("tr-TR")} ₺.`,
        summary: { total: rows.length, tutar: total },
        payments: rows.slice(0, MAX_ROWS),
        source: { dateFrom: startDate, dateTo: endDate, recordCount: rows.length },
      };
    }

    case "get_overdue_payments": {
      const invoices = await provider.getInvoices();
      const rows: AiPaymentRow[] = invoices
        .filter((i) => i.status === "overdue")
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
        .map((i) => ({ customerName: i.customerName, invoiceNo: i.invoiceNo, amount: i.amount, dueDate: i.dueDate, status: i.status }));
      if (rows.length === 0) return emptyState("Vadesi geçmiş ödenmemiş fatura bulunamadı.");
      const total = rows.reduce((s, r) => s + r.amount, 0);
      return {
        responseType: "payment_table",
        message: `Vadesi geçmiş ${rows.length} fatura var, toplam ${total.toLocaleString("tr-TR")} ₺.`,
        summary: { total: rows.length, tutar: total },
        payments: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    case "get_customer_balance": {
      const customers = await provider.getCustomers();
      const { customer, candidates } = resolveCustomer(customers, String(params.customerName ?? ""));
      if (candidates.length > 1) return clarification(candidates);
      if (!customer) return emptyState(`"${params.customerName}" adında bir müşteri bulamadım.`);
      const balanceInfo = await provider.getCustomerBalance(customer.customerId);
      return {
        responseType: "customer_card",
        message:
          balanceInfo.balance <= 0
            ? `${customer.companyName} için açık bakiye bulunmuyor.`
            : `${customer.companyName} cari bakiyesi ${balanceInfo.balance.toLocaleString("tr-TR")} ₺${balanceInfo.isOverdue ? ` (${balanceInfo.overdueDays} gün gecikmiş)` : ""}.`,
        customer: customerCard(customer),
        source: { recordCount: 1 },
      };
    }

    case "search_customers": {
      const customers = await provider.getCustomers();
      const q = String(params.query ?? "").trim().toLocaleLowerCase("tr");
      const rows: AiCustomerListItem[] = customers
        .filter((c) => c.companyName.toLocaleLowerCase("tr").includes(q) || c.city.toLocaleLowerCase("tr").includes(q) || c.sector.toLocaleLowerCase("tr").includes(q))
        .map((c) => ({ customerId: c.customerId, companyName: c.companyName, city: c.city, sector: c.sector, status: c.status }));
      if (rows.length === 0) return emptyState(`"${params.query}" ile eşleşen müşteri bulamadım.`);
      return {
        responseType: "customer_list",
        message: `"${params.query}" için ${rows.length} müşteri bulundu.`,
        customers: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    case "get_customer_details": {
      const customers = await provider.getCustomers();
      const { customer, candidates } = resolveCustomer(customers, String(params.customerName ?? ""));
      if (candidates.length > 1) return clarification(candidates);
      if (!customer) return emptyState(`"${params.customerName}" adında bir müşteri bulamadım.`);
      return {
        responseType: "customer_card",
        message: `${customer.companyName} — ${customer.sector}, ${customer.city}.`,
        customer: customerCard(customer),
        source: { recordCount: 1 },
      };
    }

    case "get_customer_branches": {
      const customers = await provider.getCustomers();
      const { customer, candidates } = resolveCustomer(customers, String(params.customerName ?? ""));
      if (candidates.length > 1) return clarification(candidates);
      if (!customer) return emptyState(`"${params.customerName}" adında bir müşteri bulamadım.`);
      return {
        responseType: "customer_card",
        message: `${customer.companyName} firmasının ${customer.branchCount} şubesi var.`,
        customer: customerCard(customer),
        source: { recordCount: 1 },
      };
    }

    case "get_customer_upcoming_services": {
      const customers = await provider.getCustomers();
      const { customer, candidates } = resolveCustomer(customers, String(params.customerName ?? ""));
      if (candidates.length > 1) return clarification(candidates);
      if (!customer) return emptyState(`"${params.customerName}" adında bir müşteri bulamadım.`);
      const occurrences = await provider.getServiceOccurrences();
      const rows = occurrences
        .filter((o) => o.customerId === customer.customerId && o.periodDate >= todayIso)
        .sort((a, b) => (a.periodDate < b.periodDate ? -1 : 1))
        .map((o) => toServiceRow(o, todayIso));
      if (rows.length === 0) return emptyState(`${customer.companyName} için yaklaşan planlanmış servis bulunamadı.`);
      return {
        responseType: "service_list",
        message: `${customer.companyName} için ${rows.length} yaklaşan servis var.`,
        services: rows.slice(0, MAX_ROWS),
        source: { dateFrom: todayIso, recordCount: rows.length },
      };
    }

    case "get_expiring_contracts": {
      const days = Number(params.days ?? 60);
      const customers = await provider.getCustomers();
      const rows: AiContractRow[] = customers
        .filter((c) => c.contractEndDate)
        .map((c) => ({ customerName: c.companyName, contractEndDate: c.contractEndDate!, daysRemaining: daysBetween(todayIso, c.contractEndDate!) }))
        .filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= days)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);
      if (rows.length === 0) return emptyState(`Önümüzdeki ${days} gün içinde bitecek sözleşme bulunamadı.`);
      return {
        responseType: "contract_list",
        message: `Önümüzdeki ${days} gün içinde ${rows.length} müşterinin sözleşmesi sona eriyor.`,
        contracts: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    case "get_technician_schedule": {
      const technicianName = String(params.technicianName ?? "");
      const date = String(params.date ?? "");
      const technicians = await provider.getTechnicians();
      const match = technicians.find((t) => t.name.toLocaleLowerCase("tr").includes(technicianName.toLocaleLowerCase("tr")));
      if (!match) return emptyState(`"${technicianName}" adında bir teknisyen bulamadım.`);
      const occurrences = await provider.getServiceOccurrences();
      const rows: AiTechnicianScheduleRow[] = occurrences
        .filter((o) => o.personnelName === match.name && o.periodDate === date)
        .sort((a, b) => (a.startTime < b.startTime ? -1 : 1))
        .map((o) => ({ periodDate: o.periodDate, startTime: o.startTime, endTime: o.endTime, customerName: o.customerName, serviceName: o.serviceName }));
      if (rows.length === 0) return emptyState(`${match.name} için ${date} tarihinde planlanmış servis bulunamadı.`);
      return {
        responseType: "technician_schedule",
        message: `${match.name} için ${date} tarihinde ${rows.length} servis planlanmış.`,
        schedule: rows,
        source: { dateFrom: date, dateTo: date, recordCount: rows.length },
      };
    }

    case "get_technician_workload": {
      const startDate = String(params.startDate ?? "");
      const endDate = String(params.endDate ?? "");
      const occurrences = await provider.getServiceOccurrences();
      const inRange = occurrences.filter((o) => o.periodDate >= startDate && o.periodDate <= endDate && o.personnelName?.trim());
      const counts = new Map<string, number>();
      for (const o of inRange) counts.set(o.personnelName, (counts.get(o.personnelName) ?? 0) + 1);
      const rows: AiTechnicianWorkloadRow[] = [...counts.entries()]
        .map(([technicianName, serviceCount]) => ({ technicianName, serviceCount }))
        .sort((a, b) => b.serviceCount - a.serviceCount);
      if (rows.length === 0) return emptyState(`${startDate} – ${endDate} aralığında atanmış servis bulunamadı.`);
      return {
        responseType: "technician_workload",
        message: `${startDate} – ${endDate} aralığında en yoğun teknisyen: ${rows[0].technicianName} (${rows[0].serviceCount} servis).`,
        workload: rows,
        source: { dateFrom: startDate, dateTo: endDate, recordCount: inRange.length },
      };
    }

    case "get_critical_risks": {
      const risks = await provider.getOpenRisks();
      const rows: AiRiskRow[] = risks
        .filter((r) => r.status === "critical" || r.status === "high")
        .map((r) => ({ title: r.title, category: r.category, score: r.likelihood * r.impact, level: r.status, customerName: r.customerName, owner: r.owner }))
        .sort((a, b) => b.score - a.score);
      if (rows.length === 0) return emptyState("Açık kritik/yüksek risk kaydı bulunamadı.");
      return {
        responseType: "risk_list",
        message: `${rows.length} açık kritik/yüksek risk kaydı bulundu.`,
        risks: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    case "get_open_corrective_actions": {
      const actions = await provider.getOpenCorrectiveActions();
      const rows: AiCorrectiveActionRow[] = actions
        .map((a) => ({ title: a.title, severity: a.severity, status: a.status, dueDate: a.dueDate, customerName: a.customerName, responsible: a.responsible, overdue: a.overdue }))
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
      if (rows.length === 0) return emptyState("Kapanmamış düzeltici/önleyici faaliyet bulunamadı.");
      return {
        responseType: "corrective_action_list",
        message: `${rows.length} kapanmamış düzeltici/önleyici faaliyet var.`,
        correctiveActions: rows.slice(0, MAX_ROWS),
        source: { recordCount: rows.length },
      };
    }

    // ------------------------------------------------------------------
    // Faz 2 — operasyonel zeka katmanı
    // ------------------------------------------------------------------

    case "get_operational_intelligence_summary": {
      const [occurrences, invoices, risks] = await Promise.all([provider.getServiceOccurrences(), provider.getInvoices(), provider.getOpenRisks()]);
      const weekStart = addDaysIso(todayIso, -6);
      const thisWeek = occurrences.filter((o) => o.periodDate >= weekStart && o.periodDate <= todayIso);
      const prevWeekRange = { startDate: addDaysIso(weekStart, -7), endDate: addDaysIso(todayIso, -7) };
      const lastWeek = occurrences.filter((o) => o.periodDate >= prevWeekRange.startDate && o.periodDate <= prevWeekRange.endDate);
      const overdue = occurrences.filter((o) => o.periodDate < todayIso && !o.isCompleted);
      const unassigned = occurrences.filter((o) => o.periodDate >= todayIso && !o.personnelName?.trim());
      const overdueInvoices = invoices.filter((i) => i.status === "overdue");
      const criticalRisks = risks.filter((r) => r.status === "critical" || r.status === "high");

      const kpis: AiKpiItem[] = [
        { label: "Bu Hafta Servis", value: thisWeek.length, action: { label: "Servisleri Aç", href: AI_ROUTES.services() } },
        { label: "Gecikmiş Servis", value: overdue.length, tone: overdue.length > 0 ? "critical" : "good" },
        { label: "Atanmamış", value: unassigned.length, tone: unassigned.length > 0 ? "warning" : "good" },
        { label: "Gecikmiş Tahsilat", value: overdueInvoices.length, tone: overdueInvoices.length > 0 ? "warning" : "good", action: { label: "Tahsilatlar'da Aç", href: AI_ROUTES.collections() } },
        { label: "Kritik Risk", value: criticalRisks.length, tone: criticalRisks.length > 0 ? "critical" : "good", action: { label: "Risk Yönetimi'nde Aç", href: AI_ROUTES.riskManagement() } },
      ];

      const alerts: string[] = [];
      if (overdue.length > 0) alerts.push(`${overdue.length} servis planlanan tarihi geçmiş durumda.`);
      if (unassigned.length > 0) alerts.push(`${unassigned.length} yaklaşan servis henüz bir teknisyene atanmamış.`);
      if (criticalRisks.length > 0) alerts.push(`${criticalRisks.length} açık kritik/yüksek risk kaydı var.`);
      if (overdueInvoices.length > 0) alerts.push(`${overdueInvoices.length} fatura vadesi geçmiş durumda.`);

      const comparison: AiMetricDelta[] = [toDelta("Bu hafta servis sayısı (geçen haftaya göre)", thisWeek.length, lastWeek.length, "up")];

      const observations: string[] = [];
      const delta = comparison[0];
      if (delta.percentChange !== null) {
        observations.push(
          delta.direction === "up"
            ? `Servis yoğunluğu geçen haftaya göre %${Math.abs(delta.percentChange)} arttı.`
            : delta.direction === "down"
              ? `Servis yoğunluğu geçen haftaya göre %${Math.abs(delta.percentChange)} azaldı.`
              : "Servis yoğunluğu geçen haftayla aynı seviyede.",
        );
      } else if (delta.note) {
        observations.push(delta.note);
      }

      const recommendations: string[] = [];
      if (unassigned.length > 0) recommendations.push("AI önerisi: Atanmamış servisler için teknisyen ataması önceliklendirilebilir.");
      if (overdue.length > 0) recommendations.push("AI önerisi: Gecikmiş servisler için müşteri bilgilendirmesi ve yeniden planlama değerlendirilebilir.");
      if (alerts.length === 0) recommendations.push("Şu an öncelikli bir operasyonel uyarı bulunmuyor.");

      const data: AiOperationalIntelligenceData = {
        period: { from: weekStart, to: todayIso, timezone: "Europe/Istanbul" },
        kpis,
        alerts,
        observations,
        recommendations,
        comparison,
        dataQuality: completeQuality(),
      };

      return {
        responseType: "operational_intelligence",
        message: alerts.length > 0 ? `Bu hafta ${thisWeek.length} servis planlandı. ${alerts[0]}` : `Bu hafta ${thisWeek.length} servis planlandı, öncelikli bir uyarı yok.`,
        operationalIntelligence: data,
        source: { dateFrom: weekStart, dateTo: todayIso, recordCount: thisWeek.length + overdue.length + criticalRisks.length },
      };
    }

    case "get_service_trend": {
      const months = Math.max(1, Math.min(Number(params.months ?? 6), 24));
      const monthKeys = lastNMonthKeys(todayIso, months);
      const occurrences = await provider.getServiceOccurrences();
      const periodFrom = `${monthKeys[0]}-01`;
      const inRange = occurrences.filter((o) => o.periodDate >= periodFrom && o.periodDate <= todayIso);
      if (inRange.length === 0) return emptyState("Bu analiz için yeterli veri bulunmuyor.");

      const countByMonth = new Map<string, number>();
      const completedByMonth = new Map<string, number>();
      for (const key of monthKeys) {
        countByMonth.set(key, 0);
        completedByMonth.set(key, 0);
      }
      for (const o of inRange) {
        const key = monthKeyOf(o.periodDate);
        if (!countByMonth.has(key)) continue;
        countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
        if (o.isCompleted) completedByMonth.set(key, (completedByMonth.get(key) ?? 0) + 1);
      }

      const chart: AiChartSpec = {
        chartType: "line",
        title: `Son ${months} Ay Servis Trendi`,
        series: [{ name: "Toplam Servis", points: monthKeys.map((k) => ({ label: monthLabelOf(k), value: countByMonth.get(k) ?? 0 })) }],
      };

      const lastKey = monthKeys.at(-1)!;
      const prevKey = monthKeys.length > 1 ? monthKeys.at(-2)! : null;
      const comparison = prevKey ? [toDelta(`${monthLabelOf(lastKey)} servis sayısı`, countByMonth.get(lastKey) ?? 0, countByMonth.get(prevKey) ?? 0, "up")] : undefined;

      const lastRatio = safeRatio(completedByMonth.get(lastKey) ?? 0, countByMonth.get(lastKey) ?? 0);
      const observations: string[] = [
        lastRatio.ratioPercent !== null
          ? `${monthLabelOf(lastKey)} tamamlanma oranı: %${lastRatio.ratioPercent}.`
          : `${monthLabelOf(lastKey)} için tamamlanma oranı hesaplanamadı (kayıt yok).`,
      ];

      const data: AiTrendAnalysisData = {
        title: `Son ${months} Aylık Servis Trendi`,
        period: { from: periodFrom, to: todayIso },
        chart,
        comparison,
        observations,
        dataQuality: monthKeys.length < 2 ? { status: "partial", missingFields: [], limitations: ["Karşılaştırma için en az 2 aylık veri gerekir."] } : completeQuality(),
      };

      return {
        responseType: "trend_analysis",
        message: `Son ${months} ay için toplam ${inRange.length} servis kaydı bulundu.`,
        trendAnalysis: data,
        source: { dateFrom: periodFrom, dateTo: todayIso, recordCount: inRange.length },
      };
    }

    case "compare_periods": {
      const metric = String(params.metric ?? "services");
      const startDate = String(params.startDate ?? "");
      const endDate = String(params.endDate ?? "");
      const prev = previousPeriodOf({ startDate, endDate });

      let current = 0;
      let previous = 0;
      let metricLabel = "Servis Sayısı";
      let recordCount = 0;

      if (metric === "payments") {
        const invoices = await provider.getInvoices();
        current = invoices.filter((i) => i.dueDate >= startDate && i.dueDate <= endDate).reduce((s, i) => s + i.amount, 0);
        previous = invoices.filter((i) => i.dueDate >= prev.startDate && i.dueDate <= prev.endDate).reduce((s, i) => s + i.amount, 0);
        metricLabel = "Beklenen Tahsilat Tutarı";
        recordCount = invoices.filter((i) => i.dueDate >= startDate && i.dueDate <= endDate).length;
      } else if (metric === "risks") {
        const risks = await provider.getAllRisks();
        current = risks.filter((r) => r.reviewDate >= startDate && r.reviewDate <= endDate).length;
        previous = risks.filter((r) => r.reviewDate >= prev.startDate && r.reviewDate <= prev.endDate).length;
        metricLabel = "Risk Kaydı Sayısı";
        recordCount = current;
      } else {
        const occurrences = await provider.getServiceOccurrences();
        current = occurrences.filter((o) => o.periodDate >= startDate && o.periodDate <= endDate).length;
        previous = occurrences.filter((o) => o.periodDate >= prev.startDate && o.periodDate <= prev.endDate).length;
        recordCount = current;
      }

      if (current === 0 && previous === 0) return emptyState("Bu kriterlere uygun kayıt bulunamadı.");

      const delta = toDelta(metricLabel, current, previous, metric === "risks" ? "down" : "up");
      const data: AiPeriodComparisonData = {
        metricLabel,
        currentLabel: `${startDate} – ${endDate}`,
        previousLabel: `${prev.startDate} – ${prev.endDate}`,
        delta,
        dataQuality: previous === 0 ? { status: "partial", missingFields: [], limitations: ["Önceki dönem için kayıt bulunamadı."] } : completeQuality(),
      };

      return {
        responseType: "period_comparison",
        message:
          delta.percentChange !== null
            ? `${metricLabel}: ${current} (önceki dönem: ${previous}, değişim: %${delta.percentChange > 0 ? "+" : ""}${delta.percentChange}).`
            : `${metricLabel}: ${current}. ${delta.note}`,
        periodComparison: data,
        source: { dateFrom: startDate, dateTo: endDate, recordCount },
      };
    }

    case "get_risk_intelligence_summary": {
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

      if (critical.length === 0 && distribution.length === 0) return emptyState("Bu analiz için yeterli veri bulunmuyor.");

      const data: AiRiskIntelligenceData = {
        criticalRisks: criticalRows.slice(0, MAX_ROWS),
        distribution,
        comparison,
        recommendations,
        dataQuality: prior === 0 ? { status: "partial", missingFields: [], limitations: ["Önceki 60 günlük dönem için kayıt bulunamadı."] } : completeQuality(),
      };

      return {
        responseType: "risk_intelligence",
        message: `${critical.length} açık kritik/yüksek risk kaydı var. Son 60 günde ${recent} risk kaydı oluştu.`,
        riskIntelligence: data,
        source: { dateFrom: windowStart, dateTo: todayIso, recordCount: recent },
      };
    }

    case "get_technician_performance_summary": {
      const startDate = String(params.startDate ?? "");
      const endDate = String(params.endDate ?? "");
      const occurrences = await provider.getServiceOccurrences();
      const inRange = occurrences.filter((o) => o.periodDate >= startDate && o.periodDate <= endDate && o.personnelName?.trim());
      if (inRange.length === 0) return emptyState("Bu analiz için yeterli veri bulunmuyor.");

      const byTech = new Map<string, AiServiceOccurrence[]>();
      for (const o of inRange) {
        if (!byTech.has(o.personnelName)) byTech.set(o.personnelName, []);
        byTech.get(o.personnelName)!.push(o);
      }

      const rows: AiTechnicianPerformanceRow[] = [...byTech.entries()]
        .map(([technicianName, list]) => {
          const completedCount = list.filter((o) => o.isCompleted).length;
          const overdueCount = list.filter((o) => o.periodDate < todayIso && !o.isCompleted).length;
          const ratio = safeRatio(completedCount, list.length);
          return { technicianName, assignedCount: list.length, completedCount, overdueCount, completionRatePercent: ratio.ratioPercent };
        })
        .sort((a, b) => b.assignedCount - a.assignedCount);

      const observations: string[] = [];
      const busiest = rows[0];
      if (busiest) observations.push(`En yoğun teknisyen: ${busiest.technicianName} (${busiest.assignedCount} servis).`);
      const highestOverdue = [...rows].sort((a, b) => b.overdueCount - a.overdueCount)[0];
      if (highestOverdue && highestOverdue.overdueCount > 0) observations.push(`En yüksek gecikme: ${highestOverdue.technicianName} (${highestOverdue.overdueCount} gecikmiş servis).`);

      const data: AiTechnicianIntelligenceData = {
        period: { from: startDate, to: endDate },
        rows,
        observations,
        dataQuality: completeQuality(),
      };

      return {
        responseType: "technician_intelligence",
        message: `${startDate} – ${endDate} aralığında ${rows.length} teknisyen için performans verisi bulundu.`,
        technicianIntelligence: data,
        source: { dateFrom: startDate, dateTo: endDate, recordCount: inRange.length },
      };
    }

    case "get_audit_readiness_summary": {
      const items = await provider.getChecklistItems();
      const data: AiAuditIntelligenceData = computeAuditReadiness(items);
      if (data.dataQuality.status === "unavailable") return emptyState("Bu analiz mevcut veri yapısında henüz desteklenmiyor.");
      return {
        responseType: "audit_intelligence",
        message:
          data.overallScorePercent !== null
            ? `Genel denetim hazırlık göstergesi: %${data.overallScorePercent}. Bu resmi bir sertifikasyon sonucu değildir.`
            : "Denetim hazırlık göstergesi için yeterli veri bulunmuyor.",
        auditIntelligence: data,
        source: { recordCount: items.length },
      };
    }

    case "generate_operational_report": {
      // Rapor VERİSİ burada toplanır (deterministik). PDF/Excel dosyası,
      // kullanıcı panelde "PDF İndir"/"Excel İndir"e bastığında (gerçek bir
      // kullanıcı jesti gerektiren window.open/print API'leri nedeniyle)
      // istemci tarafında anlık üretilir — bkz. AiReportResult bileşeni.
      const scope = String(params.scope ?? "company") === "customer" ? "customer" : "company";
      let customerId: string | undefined;
      let entityName: string | null = null;

      if (scope === "customer") {
        const customers = await provider.getCustomers();
        const { customer, candidates } = resolveCustomer(customers, String(params.customerName ?? ""));
        if (candidates.length > 1) return clarification(candidates);
        if (!customer) return emptyState(`"${params.customerName}" adında bir müşteri bulamadım.`);
        customerId = customer.customerId;
        entityName = customer.companyName;
      }

      const months = Math.max(1, Math.min(Number(params.months ?? 6), 24));
      const reportData = await buildOperationalReportData({ provider, todayIso, scope, customerId, entityName, months });

      if (reportData.dataQuality.status === "insufficient") {
        return emptyState("Bu analiz için yeterli veri bulunmuyor.");
      }

      const reportId = `rpt-${Date.now()}`;
      const title = scope === "customer" ? `${entityName} — Operasyon Özet Raporu` : "Operasyon Özet Raporu";

      return {
        responseType: "report_result",
        message: `${title} hazırlandı (${reportData.period.from} – ${reportData.period.to}). PDF veya Excel olarak indirebilirsiniz.`,
        report: {
          reportId,
          title,
          reportType: "operational_summary",
          entityName: entityName ?? undefined,
          period: reportData.period,
          status: "completed",
          steps: [
            { key: "collecting_data", label: "Veriler hazırlandı", status: "done" },
            { key: "calculating_metrics", label: "Trendler hesaplandı", status: "done" },
            { key: "generating_charts", label: "Grafikler oluşturuldu", status: "done" },
            { key: "generating_summary", label: "Yönetici özeti (AI)", status: "skipped" },
            { key: "rendering", label: "Rapor oluşturuldu", status: "done" },
          ],
          kpis: reportData.kpis,
          pdfAvailable: true,
          excelAvailable: true,
          createdAt: new Date().toISOString(),
          reportData: {
            scope: reportData.scope,
            entityName: reportData.entityName,
            period: reportData.period,
            kpis: reportData.kpis,
            serviceTrendChart: reportData.serviceTrendChart,
            comparison: reportData.comparison,
            riskDistribution: reportData.riskDistribution,
            dataQuality: reportData.dataQuality,
            sourceRecordCount: reportData.sourceRecordCount,
          },
        },
        source: { dateFrom: reportData.period.from, dateTo: reportData.period.to, recordCount: reportData.sourceRecordCount },
      };
    }

    // ------------------------------------------------------------------
    // Faz 3 — kontrollü yazma aksiyonları. Bu case'ler HİÇBİR ZAMAN veri
    // yazmaz — yalnızca bir AiActionProposal önerisi üretip döndürür (bkz.
    // proposal-builder.ts). actionContext yoksa (ör. TECH rolü bu tool'ları
    // hiç görmez ama savunma amaçlı) güvenli şekilde reddedilir.
    // ------------------------------------------------------------------

    case "propose_create_service":
    case "propose_reschedule_service":
    case "propose_assign_technician":
    case "propose_create_followup_task":
    case "propose_prepare_email":
    case "propose_send_whatsapp_message": {
      if (!actionContext) return { responseType: "error", message: "Bu işlem için oturum bilgisi bulunamadı.", source: { recordCount: 0 } };
      switch (toolName) {
        case "propose_create_service":
          return buildCreateServiceProposal(params, actionContext, todayIso);
        case "propose_reschedule_service":
          return buildRescheduleServiceProposal(params, actionContext, todayIso);
        case "propose_assign_technician":
          return buildAssignTechnicianProposal(params, actionContext);
        case "propose_create_followup_task":
          return buildCreateFollowupTaskProposal(params, actionContext, todayIso);
        case "propose_prepare_email":
          return buildPrepareEmailProposal(params, actionContext);
        case "propose_send_whatsapp_message":
          return buildSendWhatsAppMessageProposal(params, actionContext);
      }
      break;
    }

    default:
      return { responseType: "error", message: "Bilinmeyen tool.", source: { recordCount: 0 } };
  }
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}
