"use client";

import { useState } from "react";
import { BrainCircuit, FileCheck2 } from "lucide-react";
import { AI_ROUTES } from "@/lib/ai/routes";
import { AiKpiGrid } from "@/components/ai-assistant/ai-kpi-grid";
import { AiReportProgress } from "@/components/ai-assistant/ai-report-progress";
import { AiReportDownloadActions } from "@/components/ai-assistant/ai-report-download-actions";
import { AiExecutiveSummary } from "@/components/ai-assistant/ai-executive-summary";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { Button } from "@/components/ui/button";
import { printAiOperationalReport } from "@/lib/pdf/ai-operational-report";
import type { AiExecutiveSummaryData, AiReportResultData } from "@/lib/ai/types";

export function AiReportResult({ report }: { report: AiReportResultData }) {
  const [summary, setSummary] = useState<AiExecutiveSummaryData | undefined>(report.executiveSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [excelLoading, setExcelLoading] = useState(false);

  async function handleGenerateSummary() {
    if (!report.reportData) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/ai/executive-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: report.reportData }),
      });
      const body = await res.json();
      if (body.success) {
        setSummary(body.summary);
      } else {
        setSummaryError(body.message ?? "Sayısal analiz hazırlandı ancak AI yönetici özeti oluşturulamadı.");
      }
    } catch {
      setSummaryError("Sayısal analiz hazırlandı ancak AI yönetici özeti oluşturulamadı.");
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleDownloadPdf() {
    if (!report.reportData) return;
    printAiOperationalReport(report.reportData, { title: report.title, executiveSummary: summary });
  }

  async function handleDownloadExcel() {
    if (!report.reportData) return;
    setExcelLoading(true);
    try {
      const { exportAiOperationalReportExcel } = await import("@/lib/ai/reports/excel-export");
      await exportAiOperationalReportExcel(report.reportData, report.title);
    } finally {
      setExcelLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
        <FileCheck2 className="size-3.5 text-success" aria-hidden="true" />
        {report.title}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {report.period.from} – {report.period.to}
      </p>

      <AiReportProgress steps={report.steps} />
      <AiKpiGrid kpis={report.kpis} />

      {summary ? (
        <AiExecutiveSummary data={summary} />
      ) : report.reportData ? (
        <div className="flex flex-col gap-1.5">
          <Button type="button" size="sm" variant="secondary" onClick={handleGenerateSummary} loading={summaryLoading} startContent={<BrainCircuit className="size-3.5" aria-hidden="true" />}>
            AI Yönetici Özeti Oluştur
          </Button>
          {summaryError && <p className="text-[10px] text-muted-foreground">{summaryError}</p>}
        </div>
      ) : null}

      <AiReportDownloadActions
        pdfAvailable={report.pdfAvailable && !!report.reportData}
        excelAvailable={report.excelAvailable && !!report.reportData}
        onDownloadPdf={handleDownloadPdf}
        onDownloadExcel={handleDownloadExcel}
        excelLoading={excelLoading}
      />

      <AiNavigationAction action={{ label: "Raporlar Sayfasına Git", href: AI_ROUTES.reports() }} />
    </div>
  );
}
