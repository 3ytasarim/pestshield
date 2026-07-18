"use client";

import { AiLineChart } from "@/components/ai-assistant/charts/ai-line-chart";
import { AiBarChart } from "@/components/ai-assistant/charts/ai-bar-chart";
import { AiDonutChart } from "@/components/ai-assistant/charts/ai-donut-chart";
import { AiMetricDelta } from "@/components/ai-assistant/ai-metric-delta";
import { AiDataQualityBadge } from "@/components/ai-assistant/ai-data-quality-badge";
import type { AiTrendAnalysisData } from "@/lib/ai/types";

export function AiTrendAnalysis({ data }: { data: AiTrendAnalysisData }) {
  const ChartComponent = data.chart.chartType === "bar" ? AiBarChart : data.chart.chartType === "donut" ? AiDonutChart : AiLineChart;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">{data.title}</p>
        <AiDataQualityBadge dataQuality={data.dataQuality} />
      </div>
      <ChartComponent spec={data.chart} />
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
    </div>
  );
}
