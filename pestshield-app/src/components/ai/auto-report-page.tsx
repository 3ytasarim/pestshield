"use client";

// "Otomatik Rapor" — AiCommandCenter'ın "generate_operational_report" aracıyla
// AYNI deterministik veri katmanını (buildOperationalReportData) ve AYNI
// sonuç bileşenini (AiReportResult, PDF/Excel indirmeyi kendi içinde çözer)
// kullanır. İkinci bir rapor motoru icat edilmez.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FileBarChart, Save, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { cn } from "@/lib/utils";
import { getAiDataProvider } from "@/lib/ai/providers/get-data-provider";
import { todayInTimeZone } from "@/lib/ai/date-parser";
import { buildOperationalReportData } from "@/lib/ai/reports/operational-report-builder";
import { AiReportResult } from "@/components/ai-assistant/ai-report-result";
import type { AiReportResultData } from "@/lib/ai/types";

interface SavedReportSummary {
  id: string;
  title: string;
  periodFrom: string;
  periodTo: string;
  customerId: string | null;
  customerName: string | null;
  createdAt: string;
}

function todayIsoIstanbul(): string {
  const d = todayInTimeZone(new Date(), "Europe/Istanbul");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AutoReportPage() {
  const [report, setReport] = useState<AiReportResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<{ id: string; companyName: string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("company");
  const [saving, setSaving] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReportSummary[]>([]);

  function loadSavedReports() {
    fetch("/api/ai/reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reports: SavedReportSummary[] } | null) => setSavedReports(data?.reports ?? []))
      .catch(() => setSavedReports([]));
  }

  useEffect(() => {
    fetch("/api/crm/customers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customers: { id: string; companyName: string }[] } | null) => setCustomers(data?.customers ?? []))
      .catch(() => setCustomers([]));
    loadSavedReports();
  }, []);

  async function handleSave() {
    if (!report) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ai/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, customerId: selectedCustomerId === "company" ? null : selectedCustomerId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Rapor kaydedilemedi");
        return;
      }
      toast.success("Rapor kaydedildi");
      loadSavedReports();
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setEmptyMessage(null);
    try {
      const provider = getAiDataProvider();
      const todayIso = todayIsoIstanbul();
      const scope = selectedCustomerId === "company" ? "company" : "customer";
      const reportData = await buildOperationalReportData({
        provider,
        todayIso,
        scope,
        customerId: scope === "customer" ? selectedCustomerId : undefined,
        months: 6,
      });

      if (reportData.dataQuality.status === "insufficient") {
        setReport(null);
        setEmptyMessage("Bu analiz için yeterli veri bulunmuyor.");
        return;
      }

      const title = reportData.entityName ? `Operasyon Özet Raporu — ${reportData.entityName}` : "Operasyon Özet Raporu";
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selectedCustomerId} onValueChange={(v) => setSelectedCustomerId(v ?? "company")}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Kapsam seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Tüm Şirket (Genel)</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => void handleGenerate()} loading={loading} size="lg">
            <Sparkles className="size-4" />
            Rapor Oluştur
          </Button>
        </div>
      </motion.div>

      {report ? (
        <>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => void handleSave()} loading={saving}>
              <Save className="size-4" />
              Kaydet
            </Button>
          </div>
          <AiReportResult report={report} />
        </>
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

      {savedReports.length > 0 && (
        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">Kaydedilen Raporlar</p>
            <div className="flex flex-col gap-1.5">
              {savedReports.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.customerName ?? "Tüm Şirket"} · {formatDate(r.periodFrom)} – {formatDate(r.periodTo)} ·{" "}
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
