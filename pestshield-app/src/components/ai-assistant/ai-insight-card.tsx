"use client";

import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { cn } from "@/lib/utils";
import type { AiInsightItem, InsightSeverity } from "@/lib/ai/types";

const SEVERITY_STYLES: Record<InsightSeverity, string> = {
  critical: "border-destructive/25 bg-destructive/5",
  high: "border-orange-500/25 bg-orange-500/5",
  warning: "border-amber-500/25 bg-amber-500/5",
  info: "border-border/60 bg-card",
};

const SEVERITY_ICON: Record<InsightSeverity, typeof AlertOctagon> = {
  critical: AlertOctagon,
  high: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_ICON_COLOR: Record<InsightSeverity, string> = {
  critical: "text-destructive",
  high: "text-orange-600 dark:text-orange-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-muted-foreground",
};

export function AiInsightCard({ insight }: { insight: AiInsightItem }) {
  const Icon = SEVERITY_ICON[insight.severity];
  return (
    <li className={cn("rounded-lg border px-3 py-2.5 text-xs", SEVERITY_STYLES[insight.severity])}>
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 size-3.5 shrink-0", SEVERITY_ICON_COLOR[insight.severity])} aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">{insight.title}</p>
          <p className="mt-0.5 text-muted-foreground">{insight.description}</p>
          <p className="mt-1 text-[10px] text-muted-foreground/70">{insight.evidence}</p>
          {insight.navigationAction && (
            <div className="mt-2">
              <AiNavigationAction action={insight.navigationAction} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
