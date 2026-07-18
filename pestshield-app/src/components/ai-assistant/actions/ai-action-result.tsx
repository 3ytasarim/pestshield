"use client";

import { CheckCircle2 } from "lucide-react";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";

export function AiActionResult({ summary, navigation }: { summary: string; navigation?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-success/25 bg-success/5 px-3 py-2.5 text-xs">
      <div className="flex items-start gap-1.5">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
        <span className="text-foreground">{summary}</span>
      </div>
      {navigation && <AiNavigationAction action={navigation} />}
    </div>
  );
}
