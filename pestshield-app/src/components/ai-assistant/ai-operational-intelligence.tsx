"use client";

import { AlertTriangle } from "lucide-react";
import { AiKpiGrid } from "@/components/ai-assistant/ai-kpi-grid";
import { AiMetricDelta } from "@/components/ai-assistant/ai-metric-delta";
import { AiRecommendationList } from "@/components/ai-assistant/ai-recommendation-list";
import { AiDataQualityBadge } from "@/components/ai-assistant/ai-data-quality-badge";
import type { AiOperationalIntelligenceData } from "@/lib/ai/types";

export function AiOperationalIntelligence({ data }: { data: AiOperationalIntelligenceData }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">Operasyonel Zeka</p>
        <AiDataQualityBadge dataQuality={data.dataQuality} />
      </div>

      {data.alerts.length > 0 && (
        <ul className="flex flex-col gap-1.5" role="list">
          {data.alerts.map((a, i) => (
            <li key={i} className="flex items-start gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      )}

      <AiKpiGrid kpis={data.kpis} />

      {data.comparison && data.comparison.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.comparison.map((d) => (
            <AiMetricDelta key={d.label} delta={d} />
          ))}
        </div>
      )}

      {data.observations.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {data.observations.map((o, i) => (
            <p key={i}>{o}</p>
          ))}
        </div>
      )}

      <AiRecommendationList recommendations={data.recommendations} />
    </div>
  );
}
