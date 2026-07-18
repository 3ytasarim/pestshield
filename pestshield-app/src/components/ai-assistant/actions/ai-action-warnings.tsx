"use client";

import { AlertTriangle } from "lucide-react";

export function AiActionWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5" role="list">
      {warnings.map((w, i) => (
        <li key={i} className="flex items-start gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>{w}</span>
        </li>
      ))}
    </ul>
  );
}
