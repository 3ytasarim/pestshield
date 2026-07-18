"use client";

import { OctagonX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiActionFailure({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs">
      <div className="flex items-start gap-1.5">
        <OctagonX className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden="true" />
        <span className="text-foreground">{message}</span>
      </div>
      {onRetry && (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Tekrar Dene
        </Button>
      )}
    </div>
  );
}
