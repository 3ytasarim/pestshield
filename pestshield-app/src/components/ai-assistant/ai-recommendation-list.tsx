"use client";

import { Sparkles } from "lucide-react";

export function AiRecommendationList({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5" role="list">
      {recommendations.map((r, i) => (
        <li key={i} className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
          <span className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-primary">
            <Sparkles className="size-3" aria-hidden="true" />
            AI önerisi
          </span>
          <span>{r.replace(/^AI önerisi:\s*/i, "")}</span>
        </li>
      ))}
    </ul>
  );
}
