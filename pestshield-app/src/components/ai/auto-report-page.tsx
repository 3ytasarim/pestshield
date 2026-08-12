"use client";

// "Otomatik Rapor" — AiCommandCenter'ın "generate_operational_report" aracıyla
// AYNI deterministik veri katmanını (buildOperationalReportData) ve AYNI
// sonuç bileşenini (AiReportResult, PDF/Excel indirmeyi kendi içinde çözer)
// kullanır. İkinci bir rapor motoru icat edilmez.

import { useState } from "react";
import { motion } from "framer-motion";
import { FileBarChart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { cn } from "@/lib/utils";
import { getAiDataProvider } from "@/lib/ai/providers/get-data-provider";
import { todayInTimeZone } from "@/lib/ai/date-parser";
import { buildOperationalReportData } from "@/lib/ai/reports/operational-report-builder";
import { AiReportResult } from "@/components/ai-assistant/ai-report-result";
import type { AiReportResultData } from "@/lib/ai/types";

function todayIsoIstanbul(): string {
  const d = todayInTimeZone(new Date(), "Europe/Istanbul");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AutoReportPage() {
  const [report, setReport] = useState<AiReportResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setEmptyMessage(null);
    try {
      const provider = getAiDataProvider();
      const todayIso = todayIsoIstanbul();
      const reportData = await buildOperationalReportData({ provider, todayIso, scope: "company", months: 6 });

      if (reportData.dataQuality.status === "insufficient") {
        setReport(null);
        setEmptyMessage("Bu analiz için yeterli veri bulunmuyor.");
        return;
      }

      const title = "Operasyon Özet Raporu";
      setReport({
        reportId: `rpt-${Date.now()}`,
        title,
        reportType: "operational_summary",
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
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="flex items-center gap-2 text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
            <FileBarChart className="size-7 text-primary" />
            Otomatik Rapor
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Son 6 aylık gerçek servis, tahsilat ve risk verilerinizden operasyon özet raporu oluşturun; PDF veya Excel olarak
            indirin, isterseniz AI yönetici özeti ekleyin.
          </p>
        </div>
        <Button onClick={() => void handleGenerate()} loading={loading} size="lg">
          <Sparkles className="size-4" />
          Rapor Oluştur
        </Button>
      </motion.div>

      {report ? (
        <AiReportResult report={report} />
      ) : (
        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardContent>
            <EmptyState
              icon={FileBarChart}
              title={loading ? "Rapor hazırlanıyor…" : (emptyMessage ?? "Henüz bir rapor oluşturulmadı")}
              description={loading ? "" : (emptyMessage ? "" : "Başlamak için sağ üstteki \"Rapor Oluştur\" butonuna tıklayın.")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
