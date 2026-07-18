"use client";

import { Mic } from "lucide-react";
import { AiAudioLevelMeter } from "@/components/ai-assistant/voice/ai-audio-level-meter";
import { useAudioLevel } from "@/lib/voice/use-audio-level";

export function AiVoiceListeningIndicator({ active }: { active: boolean }) {
  const level = useAudioLevel(active);
  return (
    <div className="flex items-center gap-2.5" role="status" aria-live="polite">
      <div className="relative flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 motion-reduce:animate-none" aria-hidden="true" />
        <Mic className="relative size-4" aria-hidden="true" />
      </div>
      <span className="text-xs font-medium text-foreground">Dinleniyor…</span>
      <AiAudioLevelMeter level={level} />
    </div>
  );
}
