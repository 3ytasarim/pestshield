"use client";

// "Risk Tahmini" — sohbetteki "get_risk_intelligence_summary" aracıyla AYNI
// deterministik hesaplamayı (risk-intelligence-builder.ts) ve AYNI sonuç
// bileşenini (AiRiskIntelligence) kullanır.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { cn } from "@/lib/utils";
import { getAiDataProvider } from "@/lib/ai/providers/get-data-provider";
import { todayInTimeZone } from "@/lib/ai/date-parser";
import { buildRiskIntelligenceData } from "@/lib/ai/insights/risk-intelligence-builder";
import { AiRiskIntelligence } from "@/components/ai-assistant/ai-risk-intelligence";
import type { AiRiskIntelligenceData } from "@/lib/ai/types";

function todayIsoIstanbul(): string {
  const d = todayInTimeZone(new Date(), "Europe/Istanbul");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RiskPredictionPage() {
  const [data, setData] = useState<AiRiskIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const provider = getAiDataProvider();
    const result = await buildRiskIntelligenceData(provider, todayIsoIstanbul()).catch(() => null);
    setData(result);
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
            <ShieldAlert className="size-7 text-primary" />
            Risk Tahmini
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Açık kritik/yüksek risk kayıtlarınız, kategoriye göre dağılım ve son 60 günlük risk kaydı eğilimi — gerçek Risk
            Yönetimi verilerinizden hesaplanır.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} loading={loading}>
          <RefreshCw className="size-4" />
          Yenile
        </Button>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent>
          {data ? (
            <AiRiskIntelligence data={data} />
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title={loading ? "Hesaplanıyor…" : "Şu anda öne çıkan bir risk yok"}
              description={loading ? "" : "Açık kritik/yüksek risk kaydı veya yeterli risk geçmişi bulunamadı."}
            />
          )}
        </CardContent>
      </Card>

      {generatedAt && <p className="text-center text-[11px] text-muted-foreground">Son hesaplama: {new Date(generatedAt).toLocaleString("tr-TR")}</p>}
    </div>
  );
}
