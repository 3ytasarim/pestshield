"use client";

// "AI Tavsiyeleri" — sohbete gerek kalmadan, AiCommandCenter'ın proaktif
// özetinde kullandığı SAME insight-service.ts (generateOperationalInsights)
// ve SAME AiInsightFeed bileşenini kullanır. İkinci bir hesaplama katmanı
// icat edilmez; sadece "Yapay Zeka" menü grubu altında kendi başlığıyla
// sunulur.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lightbulb, RefreshCw, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { cn } from "@/lib/utils";
import { getAiDataProvider } from "@/lib/ai/providers/get-data-provider";
import { todayInTimeZone } from "@/lib/ai/date-parser";
import { generateOperationalInsights } from "@/lib/ai/insights/insight-service";
import { AiInsightFeed } from "@/components/ai-assistant/ai-insight-feed";
import type { AiInsightItem } from "@/lib/ai/types";

function todayIsoIstanbul(): string {
  const d = todayInTimeZone(new Date(), "Europe/Istanbul");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RecommendationsPage() {
  const [insights, setInsights] = useState<AiInsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const provider = getAiDataProvider();
    const result = await generateOperationalInsights(provider, todayIsoIstanbul()).catch(() => []);
    setInsights(result);
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
            <Lightbulb className="size-7 text-primary" />
            AI Tavsiyeleri
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Gerçek verilerinizden (gecikmiş servisler, tahsilatlar, riskler, düzeltici faaliyetler) türetilen öncelikli
            öneriler. Hiçbir sonuç uydurulmaz.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} loading={loading}>
          <RefreshCw className="size-4" />
          Yenile
        </Button>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent>
          {insights.length > 0 ? (
            <AiInsightFeed insights={insights} />
          ) : (
            <EmptyState
              icon={Lightbulb}
              title={loading ? "Hesaplanıyor…" : "Şu anda öne çıkan bir öneri yok"}
              description={loading ? "" : "Verileriniz düzenli görünüyor — dikkat gerektiren kritik bir durum bulunmadı."}
            />
          )}
        </CardContent>
      </Card>

      <Link
        href="/dashboard/client/reports/ai"
        className={cn(GLASS_CARD, "flex items-center justify-between rounded-2xl px-5 py-4 text-sm transition-colors hover:border-primary/40")}
      >
        <span className="text-foreground">Operasyonel, risk, teknisyen ve denetim zekasının tamamını görmek için AI Analizleri raporunu açın.</span>
        <ArrowRight className="size-4 shrink-0 text-primary" />
      </Link>

      {generatedAt && <p className="text-center text-[11px] text-muted-foreground">Son hesaplama: {new Date(generatedAt).toLocaleString("tr-TR")}</p>}
    </div>
  );
}
