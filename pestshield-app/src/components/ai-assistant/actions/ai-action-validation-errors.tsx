"use client";

import { XCircle } from "lucide-react";
import type { AiActionValidationIssue } from "@/lib/ai/actions/types";

export function AiActionValidationErrors({ errors }: { errors: AiActionValidationIssue[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5" role="list">
      {errors.map((e, i) => (
        <li key={i} className="flex items-start gap-1.5 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{e.message}</span>
        </li>
      ))}
    </ul>
  );
}
