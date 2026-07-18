"use client";

import { Loader2 } from "lucide-react";
import type { AiActionStatus } from "@/lib/ai/actions/types";

const STEP_LABEL: Partial<Record<AiActionStatus, string>> = {
  pending_confirmation: "Onay bekleniyor",
  validating: "Doğrulanıyor",
  executing: "İşlem uygulanıyor",
};

/** Yürütme sırasında gösterilen ara durum — sonuç okunup doğrulanana kadar "tamamlandı" gösterilmez. */
export function AiActionExecutionProgress({ status }: { status: AiActionStatus }) {
  const label = STEP_LABEL[status];
  if (!label) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Loader2 className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
