"use client";

import { AiRiskList } from "@/components/ai-assistant/ai-risk-list";
import { AiDonutChart } from "@/components/ai-assistant/charts/ai-donut-chart";
import { AiMetricDelta } from "@/components/ai-assistant/ai-metric-delta";
import { AiRecommendationList } from "@/components/ai-assistant/ai-recommendation-list";
import { AiDataQualityBadge } from "@/components/ai-assistant/ai-data-quality-badge";
import type { AiChartSpec, AiRiskIntelligenceData } from "@/lib/ai/types";

export function AiRiskIntelligence({ data }: { data: AiRiskIntelligenceData }) {
  const chart: AiChartSpec = {
    chartType: "donut",
    title: "Açık Risklerin Kategoriye Göre Dağılımı",
    series: [{ name: "Risk", points: data.distribution.map((d) => ({ label: d.category, value: d.count })) }],
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">Risk Zekası</p>
        <AiDataQualityBadge dataQuality={data.dataQuality} />
      </div>
      {data.criticalRisks.length > 0 && <AiRiskList risks={data.criticalRisks} />}
      {data.distribution.length > 0 && <AiDonutChart spec={chart} />}
      {data.comparison && <AiMetricDelta delta={data.comparison} />}
      <AiRecommendationList recommendations={data.recommendations} />
    </div>
  );
}
