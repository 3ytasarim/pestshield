"use client";

import { AiInsightCard } from "@/components/ai-assistant/ai-insight-card";
import type { AiInsightItem } from "@/lib/ai/types";

/** Panel açıldığında gösterilen, önem sırasına göre sıralanmış, en fazla birkaç öncelikli içgörü. */
export function AiInsightFeed({ insights }: { insights: AiInsightItem[] }) {
  if (insights.length === 0) {
    return <p className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">Şu an öncelikli bir operasyonel uyarı bulunmuyor.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase">Bugün Dikkat Etmeniz Gerekenler</p>
      <ul className="flex flex-col gap-2" role="list">
        {insights.map((insight) => (
          <AiInsightCard key={insight.id} insight={insight} />
        ))}
      </ul>
    </div>
  );
}
