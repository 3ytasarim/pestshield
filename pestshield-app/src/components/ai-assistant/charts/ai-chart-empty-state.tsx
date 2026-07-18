"use client";

import { BarChart3 } from "lucide-react";

export function AiChartEmptyState({ message = "Bu grafik için yeterli veri bulunmuyor." }: { message?: string }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 text-center">
      <BarChart3 className="size-5 text-muted-foreground/50" aria-hidden="true" />
      <p className="max-w-[220px] text-[11px] text-muted-foreground">{message}</p>
    </div>
  );
}
