"use client";

import type { ReactNode } from "react";
import { AiChartEmptyState } from "@/components/ai-assistant/charts/ai-chart-empty-state";

export function AiChartContainer({ title, hasData, children }: { title: string; hasData: boolean; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <p className="mb-2 text-[11px] font-semibold text-foreground">{title}</p>
      {hasData ? <div className="h-40 w-full motion-reduce:[&_*]:!transition-none">{children}</div> : <AiChartEmptyState />}
    </div>
  );
}
