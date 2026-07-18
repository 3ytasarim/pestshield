"use client";

import { SearchX } from "lucide-react";

export function AiEmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
      <SearchX className="size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
