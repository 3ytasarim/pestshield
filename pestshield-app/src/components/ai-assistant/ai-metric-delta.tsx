"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiMetricDelta as AiMetricDeltaType } from "@/lib/ai/types";

export function AiMetricDelta({ delta }: { delta: AiMetricDeltaType }) {
  const isGood = delta.direction === "flat" ? true : delta.direction === delta.goodDirection;
  const Icon = delta.direction === "up" ? ArrowUp : delta.direction === "down" ? ArrowDown : ArrowRight;
  const toneClass = delta.direction === "flat" ? "text-muted-foreground" : isGood ? "text-success" : "text-destructive";
  const badgeBg = delta.direction === "flat" ? "bg-muted" : isGood ? "bg-success/10" : "bg-destructive/10";

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{delta.label}</p>
          <p className="mt-0.5 text-muted-foreground">
            {delta.current} <span className="text-[10px]">(önceki: {delta.previous})</span>
          </p>
        </div>
        {delta.percentChange !== null && (
          <div className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold", toneClass, badgeBg)}>
            <Icon className="size-3" aria-hidden="true" />
            <span>%{Math.abs(delta.percentChange)}</span>
          </div>
        )}
      </div>
      {delta.percentChange === null && delta.note && <p className="text-[10px] text-muted-foreground">{delta.note}</p>}
    </div>
  );
}
