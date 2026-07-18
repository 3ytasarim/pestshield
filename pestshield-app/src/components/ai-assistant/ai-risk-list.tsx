"use client";

import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { cn } from "@/lib/utils";
import type { AiRiskRow } from "@/lib/ai/types";

const LEVEL_STYLES: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  critical: "bg-destructive/15 text-destructive",
};

export function AiRiskList({ risks }: { risks: AiRiskRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" role="list">
        {risks.map((r, i) => (
          <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{r.title}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", LEVEL_STYLES[r.level] ?? "bg-muted text-muted-foreground")}>
                {r.level} · {r.score}
              </span>
            </div>
            <p className="mt-0.5 text-muted-foreground">{r.customerName ?? "Genel"} · Sorumlu: {r.owner}</p>
          </li>
        ))}
      </ul>
      <AiNavigationAction action={{ label: "Risk Yönetimi'nde Aç", href: AI_ROUTES.riskManagement() }} />
    </div>
  );
}
