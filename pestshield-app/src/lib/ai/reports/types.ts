// PestShield AI Command Center — Faz 2 rapor motoru tipleri.
//
// Bu rapor türü, mevcut "Trend Analiz Raporu" (src/lib/trend-analysis.ts,
// kroki/istasyon bazlı zararlı aktivite analizi) ile ÇAKIŞMAZ — o rapor
// zaten var ve bu modülde yeniden üretilmez. Buradaki "Operasyon Özet
// Raporu", AI Command Center'ın kendi operasyonel zeka katmanından
// (servis/tahsilat/risk trendleri, karşılaştırmalı KPI'lar, AI yönetici
// özeti) üretilen YENİ bir rapor türüdür.

export type ReportType = "operational_summary";

export type ReportStatus = "pending" | "validating" | "collecting_data" | "calculating_metrics" | "generating_charts" | "generating_summary" | "rendering" | "completed" | "failed";

export interface ReportMetadata {
  id: string;
  userId: string;
  reportType: ReportType;
  title: string;
  entityType: "company" | "customer";
  entityId: string | null;
  entityName: string | null;
  dateFrom: string;
  dateTo: string;
  status: ReportStatus;
  summary: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  modelProvider?: string;
  modelName?: string;
  promptVersion?: string;
  reportVersion: string;
  sourceRecordCount: number;
  /** PDF/Excel'i geçmişten yeniden indirebilmek için — dosya DEĞİL, sayısal/yapılandırılmış özet veri. */
  reportData?: import("@/lib/ai/types").AiReportResultData["reportData"];
}

export const REPORT_ENGINE_VERSION = "operational-report-v1";
