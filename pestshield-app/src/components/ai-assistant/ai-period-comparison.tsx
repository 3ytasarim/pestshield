"use client";

import { AiMetricDelta } from "@/components/ai-assistant/ai-metric-delta";
import { AiDataQualityBadge } from "@/components/ai-assistant/ai-data-quality-badge";
import type { AiPeriodComparisonData } from "@/lib/ai/types";

export function AiPeriodComparison({ data }: { data: AiPeriodComparisonData }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">{data.metricLabel}</p>
        <AiDataQualityBadge dataQuality={data.dataQuality} />
      </div>
      <AiMetricDelta delta={data.delta} />
      <p className="text-[10px] text-muted-foreground">
        Mevcut dönem: {data.currentLabel} · Önceki dönem: {data.previousLabel}
      </p>
    </div>
  );
}
