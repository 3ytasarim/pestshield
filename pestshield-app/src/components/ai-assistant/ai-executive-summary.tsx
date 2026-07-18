"use client";

import { BrainCircuit } from "lucide-react";
import { AiRecommendationList } from "@/components/ai-assistant/ai-recommendation-list";
import type { AiExecutiveSummaryData } from "@/lib/ai/types";

export function AiExecutiveSummary({ data }: { data: AiExecutiveSummaryData }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase">
        <BrainCircuit className="size-3.5" aria-hidden="true" />
        AI Yönetici Özeti
      </div>
      <p className="text-sm font-semibold text-foreground">{data.headline}</p>
      <p className="text-xs text-muted-foreground">{data.summary}</p>

      {data.keyFindings.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Öne Çıkanlar</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-xs text-foreground" role="list">
            {data.keyFindings.map((f, i) => (
              <li key={i}>• {f}</li>
            ))}
          </ul>
        </div>
      )}

      {data.risks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Dikkat Edilmesi Gerekenler</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-xs text-foreground" role="list">
            {data.risks.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      <AiRecommendationList recommendations={data.recommendations} />

      {data.limitations.length > 0 && (
        <p className="text-[10px] text-muted-foreground/70">Veri sınırlamaları: {data.limitations.join(" ")}</p>
      )}

      <p className="text-[9px] text-muted-foreground/50">Prompt sürümü: {data.promptVersion} — bu özet AI tarafından, yalnızca hesaplanmış verilerden üretilmiştir.</p>
    </div>
  );
}
