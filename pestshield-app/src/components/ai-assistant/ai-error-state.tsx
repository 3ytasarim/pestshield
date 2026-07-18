"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export function AiErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive" role="alert">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-1.5 inline-flex items-center gap-1 rounded font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:outline-none"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
