"use client";

import { AiPromptSuggestions } from "@/components/ai-assistant/ai-prompt-suggestions";

export function AiWelcomeState({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-muted/60 px-3.5 py-2.5 text-sm text-foreground">
        Merhaba, ben PestShield AI Asistan. Servis planları, periyodik uygulamalar, müşteriler, tahsilatlar, operasyonlar ve riskler
        hakkında sorularınızı yanıtlayabilirim.
      </div>
      <AiPromptSuggestions onPick={onPick} />
    </div>
  );
}
