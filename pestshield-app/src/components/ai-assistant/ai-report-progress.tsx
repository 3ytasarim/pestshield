"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiReportProgressStepItem } from "@/lib/ai/types";

export function AiReportProgress({ steps }: { steps: AiReportProgressStepItem[] }) {
  return (
    <ul className="flex flex-col gap-1" role="list">
      {steps.map((step) => (
        <li key={step.key} className="flex items-center gap-2 text-[11px]">
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full",
              step.status === "done" && "bg-success/15 text-success",
              step.status === "failed" && "bg-destructive/15 text-destructive",
              step.status === "skipped" && "bg-muted text-muted-foreground",
            )}
          >
            {step.status === "failed" ? <X className="size-2.5" aria-hidden="true" /> : <Check className="size-2.5" aria-hidden="true" />}
          </span>
          <span className={cn(step.status === "skipped" ? "text-muted-foreground line-through" : "text-foreground")}>{step.label}</span>
        </li>
      ))}
    </ul>
  );
}
