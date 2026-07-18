"use client";

// PestShield — "AI Analizleri" raporu. Sohbete gerek kalmadan, panel her
// açıldığında AI Command Center'ın Faz 2 zeka katmanının (operasyonel,
// risk, teknisyen, denetim analizi + proaktif içgörüler) SAME bileşenlerini
// ve SAME salt-okunur tool'larını kullanarak tek bir sayfada gösterir —
// ikinci bir hesaplama/görüntüleme katmanı icat edilmez.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { getAiDataProvider } from "@/lib/ai/providers/get-data-provider";
import { executeAiTool } from "@/lib/ai/tools/executor";
import { todayInTimeZone } from "@/lib/ai/date-parser";
import { generateOperationalInsights } from "@/lib/ai/insights/insight-service";
import { AiOperationalIntelligence } from "@/components/ai-assistant/ai-operational-intelligence";
import { AiRiskIntelligence } from "@/components/ai-assistant/ai-risk-intelligence";
import { AiTechnicianIntelligence } from "@/components/ai-assistant/ai-technician-intelligence";
import { AiAuditIntelligence } from "@/components/ai-assistant/ai-audit-intelligence";
import { AiInsightFeed } from "@/components/ai-assistant/ai-insight-feed";
import type {
  AiAuditIntelligenceData,
  AiInsightItem,
  AiOperationalIntelligenceData,
  AiRiskIntelligenceData,
  AiTechnicianIntelligenceData,
} from "@/lib/ai/types";

function todayIsoIstanbul(): string {
  const d = todayInTimeZone(new Date(), "Europe/Istanbul");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface AnalyticsState {
  operational: AiOperationalIntelligenceData | null;
  risk: AiRiskIntelligenceData | null;
  technician: AiTechnicianIntelligenceData | null;
  audit: AiAuditIntelligenceData | null;
  insights: AiInsightItem[];
  operationalEmpty: boolean;
  riskEmpty: boolean;
  technicianEmpty: boolean;
  auditEmpty: boolean;
}

const EMPTY_STATE: AnalyticsState = {
  operational: null,
  risk: null,
  technician: null,
  audit: null,
  insights: [],
  operationalEmpty: false,
  riskEmpty: false,
  technicianEmpty: false,
  auditEmpty: false,
};

export function AiAnalyticsReportPage() {
  const [state, setState] = useState<AnalyticsState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const provider = getAiDataProvider();
    const todayIso = todayIsoIstanbul();
    const startDate = addDaysIso(todayIso, -30);

    const [operationalResult, riskResult, technicianResult, auditResult, insights] = await Promise.all([
      executeAiTool(provider, "get_operational_intelligence_summary", {}, todayIso),
      executeAiTool(provider, "get_risk_intelligence_summary", {}, todayIso),
      executeAiTool(provider, "get_technician_performance_summary", { startDate, endDate: todayIso }, todayIso),
      executeAiTool(provider, "get_audit_readiness_summary", {}, todayIso),
      generateOperationalInsights(provider, todayIso).catch(() => []),
    ]);

    setState({
      operational: operationalResult.operationalIntelligence ?? null,
      operationalEmpty: operationalResult.responseType === "empty_state",
      risk: riskResult.riskIntelligence ?? null,
      riskEmpty: riskResult.responseType === "empty_state",
      technician: technicianResult.technicianIntelligence ?? null,
      technicianEmpty: technicianResult.responseType === "empty_state",
      audit: auditResult.auditIntelligence ?? null,
      auditEmpty: auditResult.responseType === "empty_state",
      insights,
    });
    setGeneratedAt(new Date().toISOString());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

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
            <Sparkles className="size-7 text-primary" />
            AI Analizleri
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            AI Command Center&apos;ın operasyonel, risk, teknisyen ve denetim zekası — sohbet etmeden, tek bir sayfada. Tüm
            sayılar mevcut gerçek verilerden hesaplanır, hiçbir sonuç uydurulmaz.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} loading={loading}>
          <RefreshCw className="size-4" />
          Yenile
        </Button>
      </motion.div>

      {state.insights.length > 0 && (
        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardContent>
            <AiInsightFeed insights={state.insights} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnalyticsCard title="Operasyonel Zeka">
          {state.operational ? <AiOperationalIntelligence data={state.operational} /> : <EmptyNote loading={loading} isEmpty={state.operationalEmpty} />}
        </AnalyticsCard>

        <AnalyticsCard title="Risk Zekası">
          {state.risk ? <AiRiskIntelligence data={state.risk} /> : <EmptyNote loading={loading} isEmpty={state.riskEmpty} />}
        </AnalyticsCard>

        <AnalyticsCard title="Teknisyen Performansı (son 30 gün)">
          {state.technician ? <AiTechnicianIntelligence data={state.technician} /> : <EmptyNote loading={loading} isEmpty={state.technicianEmpty} />}
        </AnalyticsCard>

        <AnalyticsCard title="Denetim Hazırlık Göstergesi">
          {state.audit ? <AiAuditIntelligence data={state.audit} /> : <EmptyNote loading={loading} isEmpty={state.auditEmpty} />}
        </AnalyticsCard>
      </div>

      {generatedAt && <p className="text-center text-[11px] text-muted-foreground">Son hesaplama: {new Date(generatedAt).toLocaleString("tr-TR")}</p>}
    </div>
  );
}

function AnalyticsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className={cn(GLASS_CARD, "rounded-2xl")}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyNote({ loading, isEmpty }: { loading: boolean; isEmpty: boolean }) {
  if (loading) return <p className="text-xs text-muted-foreground">Hesaplanıyor…</p>;
  return <p className="text-xs text-muted-foreground">{isEmpty ? "Bu analiz için yeterli veri bulunmuyor." : "Veri yüklenemedi."}</p>;
}
