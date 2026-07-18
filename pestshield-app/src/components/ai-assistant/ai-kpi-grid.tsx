"use client";

import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { cn } from "@/lib/utils";
import type { AiKpiItem } from "@/lib/ai/types";

const TONE_STYLES: Record<NonNullable<AiKpiItem["tone"]>, string> = {
  neutral: "border-border/60 bg-card",
  good: "border-success/25 bg-success/5",
  warning: "border-amber-500/25 bg-amber-500/5",
  critical: "border-destructive/25 bg-destructive/5",
};

const TONE_VALUE_STYLES: Record<NonNullable<AiKpiItem["tone"]>, string> = {
  neutral: "text-foreground",
  good: "text-success",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-destructive",
};

export function AiKpiGrid({ kpis }: { kpis: AiKpiItem[] }) {
  const actions = kpis.filter((k) => k.action);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((kpi) => {
          const tone = kpi.tone ?? "neutral";
          return (
            <div key={kpi.label} className={cn("rounded-xl border px-3 py-2.5", TONE_STYLES[tone])}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">{kpi.label}</p>
              <p className={cn("mt-0.5 text-lg font-bold", TONE_VALUE_STYLES[tone])}>{kpi.value}</p>
            </div>
          );
        })}
      </div>
      {actions.length > 0 && actions[0].action && <AiNavigationAction action={actions[0].action} />}
    </div>
  );
}
