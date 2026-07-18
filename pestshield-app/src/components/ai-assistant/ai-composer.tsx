"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiVoiceButton } from "@/components/ai-assistant/voice/ai-voice-button";
import { AiVoiceRecorder } from "@/components/ai-assistant/voice/ai-voice-recorder";
import type { VoicePreferences } from "@/lib/voice/voice-preferences-store";

export function AiComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  voicePreferences,
  onVoicePreferencesChange,
  sttServerAvailable,
  ttsServerAvailable,
  onVoiceSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  voicePreferences: VoicePreferences;
  onVoicePreferencesChange: (patch: Partial<VoicePreferences>) => void;
  sttServerAvailable: boolean;
  ttsServerAvailable: boolean;
  /** Sesle algılanan, kullanıcının düzenleyip onayladığı metin — normal metin gönderimiyle AYNI yola (onSend) girer, ayrı bir yürütme yolu YOKTUR. */
  onVoiceSubmit: (text: string) => void;
}) {
  const [voiceOpen, setVoiceOpen] = useState(false);

  if (voiceOpen) {
    return (
      <AiVoiceRecorder
        preferences={voicePreferences}
        onPreferencesChange={onVoicePreferencesChange}
        sttServerAvailable={sttServerAvailable}
        ttsServerAvailable={ttsServerAvailable}
        onSubmit={onVoiceSubmit}
        onClose={() => setVoiceOpen(false)}
      />
    );
  }

  return (
    <div className="shrink-0 border-t border-border/60 p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Bir soru sorun…"
          aria-label="Mesajınızı yazın"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl"
          disabled={disabled}
        />
        <AiVoiceButton onClick={() => setVoiceOpen(true)} disabled={disabled} />
        <Button size="icon" onClick={onSubmit} disabled={disabled || !value.trim()} aria-label="Gönder">
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
