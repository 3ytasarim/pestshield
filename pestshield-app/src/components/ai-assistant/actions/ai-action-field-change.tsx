"use client";

import { ArrowRight } from "lucide-react";
import type { AiActionFieldChange as AiActionFieldChangeType } from "@/lib/ai/actions/types";

export function AiActionFieldChange({ change }: { change: AiActionFieldChangeType }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
      <span className="font-medium text-muted-foreground">{change.label}</span>
      <div className="flex items-center gap-1.5 text-right">
        {change.before && <span className="text-muted-foreground line-through decoration-destructive/50">{change.before}</span>}
        {change.before && <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />}
        <span className="font-semibold text-foreground">{change.after}</span>
      </div>
    </div>
  );
}
