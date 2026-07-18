"use client";

import { Settings2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AiVoiceListeningIndicator } from "@/components/ai-assistant/voice/ai-voice-listening-indicator";
import { AiVoiceTranscriptionPreview } from "@/components/ai-assistant/voice/ai-voice-transcription-preview";
import { AiVoiceErrorState } from "@/components/ai-assistant/voice/ai-voice-error-state";
import { AiVoiceSettings } from "@/components/ai-assistant/voice/ai-voice-settings";
import { useVoiceRecorder } from "@/lib/voice/use-voice-recorder";
import type { VoicePreferences } from "@/lib/voice/voice-preferences-store";

const LANGUAGE = "tr-TR";

/**
 * AI panelinin tek ses kaydı yüzeyi — composer'ın üzerinde açılır/kapanır bir
 * kart olarak render edilir. Tüm ses durum mantığı use-voice-recorder.ts'de,
 * bileşenin kendisi sadece görüntüler (spesifikasyon: "Do not place voice
 * logic directly inside the main AI panel component" — burada da aynı ilke
 * uygulanır, mantık hook'ta, composer'da değil).
 */
export function AiVoiceRecorder({
  preferences,
  onPreferencesChange,
  sttServerAvailable,
  ttsServerAvailable,
  onSubmit,
  onClose,
}: {
  preferences: VoicePreferences;
  onPreferencesChange: (patch: Partial<VoicePreferences>) => void;
  sttServerAvailable: boolean;
  ttsServerAvailable: boolean;
  onSubmit: (text: string) => void;
  onClose: () => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const { state, transcript, confidenceLabel, error, start, stop, cancel, setTranscript, reset } = useVoiceRecorder(preferences.sttMode, LANGUAGE);

  function handleCancel() {
    cancel();
    onClose();
  }

  function handleSubmit() {
    if (!transcript.trim()) return;
    onSubmit(transcript.trim());
    reset();
    onClose();
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/30 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase">Sesli Komut</span>
        <div className="flex items-center gap-0.5">
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => setShowSettings((v) => !v)} aria-label="Ses ayarları" aria-expanded={showSettings}>
            <Settings2 className="size-3.5" />
          </Button>
          <Button type="button" size="icon-xs" variant="ghost" onClick={handleCancel} aria-label="Sesli komutu kapat">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <AiVoiceSettings preferences={preferences} onChange={onPreferencesChange} sttServerAvailable={sttServerAvailable} ttsServerAvailable={ttsServerAvailable} />
      )}

      {state === "idle" && (
        <Button type="button" onClick={start} className="w-full">
          Konuşmaya başla
        </Button>
      )}

      {state === "listening" && (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-2.5">
          <AiVoiceListeningIndicator active />
          <Button type="button" size="sm" onClick={stop}>
            Durdur
          </Button>
        </div>
      )}

      {state === "processing" && <p className="rounded-xl border border-border/60 bg-card p-2.5 text-center text-xs text-muted-foreground">İşleniyor…</p>}

      {state === "review" && (
        <AiVoiceTranscriptionPreview text={transcript} onChange={setTranscript} confidenceLabel={confidenceLabel} onSubmit={handleSubmit} onCancel={handleCancel} />
      )}

      {state === "error" && error && <AiVoiceErrorState kind={error.kind} onRetry={start} onDismiss={handleCancel} />}
    </div>
  );
}
