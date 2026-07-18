// PestShield AI Command Center — paylaşılan tipler.
//
// ÖNEMLİ MİMARİ NOT: Bu uygulamada CRM/servis/periyot/tahsilat/risk verisi
// gerçek bir veritabanında değil, tarayıcı localStorage'ında tutuluyor
// (bkz. src/lib/ai/providers/data-provider.ts). Tool fonksiyonları backend'de
// bir SQL sorgusu çalıştırmıyor — LLM sadece tools.ts'de tanımlı sabit,
// tipli, doğrulanmış tool şemalarını görüyor ve hangi tool'u hangi
// parametrelerle çağıracağına karar veriyor; gerçek veri okuma işlemi
// AiDataProvider implementasyonu üzerinden (bugün: tarayıcıda, ileride:
// gerçek backend'de) yapılıyor. LLM hiçbir zaman ham storage/DB erişimi
// almıyor, sadece bu dosyadaki whitelisted tool sonuçlarını görüyor.
//
// Bu uygulamanın veri modelinde "periyot" (periyodik uygulama) ve "servis"
// aynı temel kaydı (PeriyotOccurrence) ifade eder — ayrı bir "servis" veri
// modeli yoktur. Bu yüzden get_services_* ve get_periodic_services_*
// tool'ları bilinçli olarak aynı temel veriyi farklı bağlamlarda sunar; bu
// bir hata değil, mevcut veri modeline sadık kalma kararıdır (bkz. final rapor).

import type { AiActionProposal } from "@/lib/ai/actions/types";

export type AiToolName =
  | "get_today_summary"
  | "get_dashboard_summary"
  | "get_services_by_date"
  | "get_services_by_date_range"
  | "get_overdue_services"
  | "get_incomplete_services"
  | "get_unassigned_services"
  | "get_periodic_services_by_date"
  | "get_upcoming_periodic_services"
  | "get_overdue_periodic_services"
  | "get_expected_payments"
  | "get_overdue_payments"
  | "get_customer_balance"
  | "search_customers"
  | "get_customer_details"
  | "get_customer_branches"
  | "get_customer_upcoming_services"
  | "get_expiring_contracts"
  | "get_technician_schedule"
  | "get_technician_workload"
  | "get_critical_risks"
  | "get_open_corrective_actions"
  // Faz 2 — operasyonel zeka katmanı (bkz. dosya sonundaki Faz 2 notu)
  | "get_operational_intelligence_summary"
  | "get_service_trend"
  | "compare_periods"
  | "get_risk_intelligence_summary"
  | "get_technician_performance_summary"
  | "get_audit_readiness_summary"
  | "generate_operational_report"
  // Faz 3 — kontrollü yazma aksiyonları (bkz. src/lib/ai/actions/registry.ts).
  // Bu tool'lar HİÇBİR ZAMAN doğrudan veri yazmaz — sadece bir AiActionProposal
  // önerisi üretir; gerçek yazma yalnızca kullanıcının AÇIK ONAYINDAN SONRA,
  // src/lib/ai/actions/executors.ts içindeki güvenilir kodla gerçekleşir.
  | "propose_create_service"
  | "propose_reschedule_service"
  | "propose_assign_technician"
  | "propose_create_followup_task"
  | "propose_prepare_email"
  | "propose_send_whatsapp_message";

export type AiResponseType =
  | "summary"
  | "kpi_grid"
  | "service_list"
  | "periodic_service_list"
  | "payment_table"
  | "customer_card"
  | "customer_list"
  | "contract_list"
  | "technician_schedule"
  | "technician_workload"
  | "risk_list"
  | "corrective_action_list"
  | "empty_state"
  | "error"
  | "clarification"
  // Faz 2
  | "operational_intelligence"
  | "trend_analysis"
  | "period_comparison"
  | "risk_intelligence"
  | "technician_intelligence"
  | "audit_intelligence"
  | "proactive_insights"
  | "executive_summary"
  | "report_confirmation"
  | "report_progress"
  | "report_result"
  | "chart"
  | "data_quality_warning"
  // Faz 3 — kontrollü yazma aksiyonları. Spesifikasyondaki ayrıntılı
  // response-type listesi (action_clarification/action_entity_selection/vb.)
  // burada TEK bir "action_proposal" tipine sadeleştirildi — Faz 3.1'de
  // yalnızca 6 aksiyon tipi olduğundan ayrı tipler gereksiz karmaşıklık
  // katardı; varlık belirsizliği zaten mevcut "clarification" tipiyle
  // çözülüyor (bkz. proposal-builder.ts).
  | "action_proposal";

export interface AiKpiItem {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warning" | "critical";
  action?: AiNavigationAction;
}

export interface AiNavigationAction {
  label: string;
  href: string;
}

export interface AiServiceRow {
  occurrenceId: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  personnelName: string;
  periodDate: string;
  startTime: string;
  endTime: string;
  status: "tamamlandi" | "bekliyor" | "gecikti";
}

export interface AiPaymentRow {
  customerName: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
}

export interface AiCustomerCard {
  customerId: string;
  companyName: string;
  sector: string;
  city: string;
  status: string;
  riskLevel: string;
  pendingCollection: number;
  contractEndDate: string | null;
  branchCount: number;
}

export interface AiCustomerListItem {
  customerId: string;
  companyName: string;
  city: string;
  sector: string;
  status: string;
}

export interface AiContractRow {
  customerName: string;
  contractEndDate: string;
  daysRemaining: number;
}

export interface AiRiskRow {
  title: string;
  category: string;
  score: number;
  level: string;
  customerName: string | null;
  owner: string;
}

export interface AiCorrectiveActionRow {
  title: string;
  severity: string;
  status: string;
  dueDate: string;
  customerName: string | null;
  responsible: string;
  overdue: boolean;
}

export interface AiTechnicianScheduleRow {
  periodDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  serviceName: string;
}

export interface AiTechnicianWorkloadRow {
  technicianName: string;
  serviceCount: number;
}

// ---------------------------------------------------------------------------
// Faz 2 — operasyonel zeka katmanı tipleri
//
// Faz 2, Faz 1'in salt-okunur mimarisini KORUR: bu tipler hiçbir yazma
// işlemi tanımlamaz, sadece mevcut tool sonuçlarından (AiToolResult)
// TÜRETİLEN, deterministik hesaplamalarla üretilen analiz/rapor
// yapılarını tanımlar. Her sayısal alan bir tool sonucundan/gerçek
// veriden gelir — LLM hiçbir zaman bir metrik "üretmez", sadece bu
// yapıyı yorumlayan kısa bir yönetici özeti (AiExecutiveSummary) yazar.
// ---------------------------------------------------------------------------

export type AiDataQualityStatus = "complete" | "partial" | "insufficient" | "unavailable";

export interface AiDataQuality {
  status: AiDataQualityStatus;
  missingFields: string[];
  limitations: string[];
}

export interface AiSourceInfo {
  dateFrom?: string;
  dateTo?: string;
  recordTypes?: string[];
  recordCount: number;
  generatedAt?: string;
  timezone?: string;
}

export type InsightSeverity = "info" | "warning" | "high" | "critical";

export type InsightType =
  | "overdue_service"
  | "unassigned_service"
  | "overdue_payment"
  | "upcoming_payment"
  | "expiring_contract"
  | "rising_risk"
  | "missing_document"
  | "open_corrective_action"
  | "audit_score_drop"
  | "periodic_service_due";

export interface AiInsightItem {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  evidence: string;
  sourceRecordCount: number;
  relatedEntityType?: "customer" | "technician";
  relatedEntityId?: string;
  navigationAction?: AiNavigationAction;
  createdAt: string;
}

export interface AiMetricDelta {
  label: string;
  current: number;
  previous: number;
  absoluteChange: number;
  percentChange: number | null;
  direction: "up" | "down" | "flat";
  note: string | null;
  /** "up" = her zaman iyi değil; bazı metriklerde (gecikme sayısı) artış kötüdür. */
  goodDirection: "up" | "down";
}

export interface AiOperationalIntelligenceData {
  period: { from: string; to: string; timezone: string };
  kpis: AiKpiItem[];
  alerts: string[];
  observations: string[];
  recommendations: string[];
  comparison?: AiMetricDelta[];
  dataQuality: AiDataQuality;
}

export interface AiTrendPoint {
  label: string;
  value: number;
}

export interface AiTrendSeries {
  name: string;
  points: AiTrendPoint[];
  color?: string;
}

export interface AiChartSpec {
  chartType: "line" | "bar" | "donut";
  title: string;
  series: AiTrendSeries[];
  /** Donut grafik için tekil kategori-değer çiftleri (series[0] kullanılır). */
  unit?: string;
}

export interface AiTrendAnalysisData {
  title: string;
  period: { from: string; to: string };
  chart: AiChartSpec;
  comparison?: AiMetricDelta[];
  observations: string[];
  dataQuality: AiDataQuality;
}

export interface AiPeriodComparisonData {
  metricLabel: string;
  currentLabel: string;
  previousLabel: string;
  delta: AiMetricDelta;
  dataQuality: AiDataQuality;
}

export interface AiRiskDistributionSlice {
  category: string;
  count: number;
}

export interface AiRiskIntelligenceData {
  criticalRisks: AiRiskRow[];
  distribution: AiRiskDistributionSlice[];
  comparison?: AiMetricDelta;
  recommendations: string[];
  dataQuality: AiDataQuality;
}

export interface AiTechnicianPerformanceRow {
  technicianName: string;
  assignedCount: number;
  completedCount: number;
  overdueCount: number;
  completionRatePercent: number | null;
}

export interface AiTechnicianIntelligenceData {
  period: { from: string; to: string };
  rows: AiTechnicianPerformanceRow[];
  observations: string[];
  dataQuality: AiDataQuality;
}

export interface AiAuditFactorDetail {
  standard: string;
  compliant: number;
  nonCompliant: number;
  pending: number;
  scorePercent: number | null;
}

export interface AiAuditIntelligenceData {
  scoreFormulaVersion: string;
  overallScorePercent: number | null;
  factors: AiAuditFactorDetail[];
  missingDocuments: string[];
  disclaimer: string;
  dataQuality: AiDataQuality;
}

export interface AiExecutiveSummaryData {
  headline: string;
  summary: string;
  keyFindings: string[];
  risks: string[];
  recommendations: string[];
  limitations: string[];
  generatedByAi: boolean;
  promptVersion: string;
}

export type AiReportProgressStepStatus = "done" | "skipped" | "failed";

export interface AiReportProgressStepItem {
  key: string;
  label: string;
  status: AiReportProgressStepStatus;
}

export interface AiReportResultData {
  reportId: string;
  title: string;
  reportType: string;
  entityName?: string;
  period: { from: string; to: string };
  status: "completed" | "failed";
  errorMessage?: string;
  steps: AiReportProgressStepItem[];
  kpis: AiKpiItem[];
  executiveSummary?: AiExecutiveSummaryData;
  pdfAvailable: boolean;
  excelAvailable: boolean;
  createdAt: string;
  /** PDF/Excel'i kullanıcı gerçek bir tıklama jestiyle indirdiğinde yeniden render etmek için gereken tam veri. */
  reportData?: {
    scope: "company" | "customer";
    entityName: string | null;
    period: { from: string; to: string };
    kpis: AiKpiItem[];
    serviceTrendChart: AiChartSpec;
    comparison: AiMetricDelta[];
    riskDistribution: AiRiskDistributionSlice[];
    dataQuality: AiDataQuality;
    sourceRecordCount: number;
  };
}

export interface AiToolResult {
  responseType: AiResponseType;
  message: string;
  summary?: Record<string, number | string>;
  kpis?: AiKpiItem[];
  services?: AiServiceRow[];
  payments?: AiPaymentRow[];
  customer?: AiCustomerCard;
  customers?: AiCustomerListItem[];
  candidates?: { customerId: string; companyName: string; city: string }[];
  contracts?: AiContractRow[];
  risks?: AiRiskRow[];
  correctiveActions?: AiCorrectiveActionRow[];
  schedule?: AiTechnicianScheduleRow[];
  workload?: AiTechnicianWorkloadRow[];
  action?: AiNavigationAction;
  // Faz 2
  operationalIntelligence?: AiOperationalIntelligenceData;
  trendAnalysis?: AiTrendAnalysisData;
  periodComparison?: AiPeriodComparisonData;
  riskIntelligence?: AiRiskIntelligenceData;
  technicianIntelligence?: AiTechnicianIntelligenceData;
  auditIntelligence?: AiAuditIntelligenceData;
  insights?: AiInsightItem[];
  executiveSummary?: AiExecutiveSummaryData;
  report?: AiReportResultData;
  dataQuality?: AiDataQuality;
  // Faz 3
  proposal?: AiActionProposal;
  source: AiSourceInfo;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  toolResult?: AiToolResult;
}
