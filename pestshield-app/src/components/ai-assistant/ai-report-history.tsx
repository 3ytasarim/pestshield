"use client";

import { useState } from "react";
import { FileClock } from "lucide-react";
import { formatDate } from "@/components/crm/crm-format";
import { AiReportDownloadActions } from "@/components/ai-assistant/ai-report-download-actions";
import { printAiOperationalReport } from "@/lib/pdf/ai-operational-report";
import type { ReportMetadata } from "@/lib/ai/reports/types";

export function AiReportHistory({ reports }: { reports: ReportMetadata[] }) {
  const [excelLoadingId, setExcelLoadingId] = useState<string | null>(null);

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
        <FileClock className="size-5 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">Henüz oluşturulmuş bir rapor yok.</p>
      </div>
    );
  }

  async function handleExcel(report: ReportMetadata) {
    if (!report.reportData) return;
    setExcelLoadingId(report.id);
    try {
      const { exportAiOperationalReportExcel } = await import("@/lib/ai/reports/excel-export");
      await exportAiOperationalReportExcel(report.reportData, report.title);
    } finally {
      setExcelLoadingId(null);
    }
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {reports.map((report) => (
        <li key={report.id} className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground">{report.title}</span>
            <span className="text-[10px] text-muted-foreground">{formatDate(report.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-muted-foreground">
            {report.dateFrom} – {report.dateTo} · {report.status === "completed" ? "Tamamlandı" : report.status === "failed" ? "Başarısız" : report.status}
          </p>
          {report.reportData && (
            <div className="mt-2">
              <AiReportDownloadActions
                pdfAvailable
                excelAvailable
                onDownloadPdf={() => report.reportData && printAiOperationalReport(report.reportData, { title: report.title })}
                onDownloadExcel={() => handleExcel(report)}
                excelLoading={excelLoadingId === report.id}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
