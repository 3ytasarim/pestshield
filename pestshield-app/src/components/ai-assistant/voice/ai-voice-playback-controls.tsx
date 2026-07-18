"use client";

import { Pause, Play, Square, Volume2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoicePlaybackState } from "@/lib/voice/types";

/** Bir AI yanıtının yanında gösterilen "Sesli Oku" kontrolü — spesifikasyonun "long tables row by row okuma" yasağına uygun olarak yalnızca kısa özet metni seslendirir (bkz. buildSpokenSummary). */
export function AiVoicePlaybackControls({
  state,
  onPlay,
  onPause,
  onResume,
  onStop,
}: {
  state: VoicePlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  if (state === "idle" || state === "stopped" || state === "error") {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={onPlay} className="h-6 gap-1 px-2 text-[11px] text-muted-foreground">
        <Volume2 className="size-3" />
        Sesli Oku
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Sesli yanıt kontrolleri">
      {state === "playing" ? (
        <Button type="button" size="icon-xs" variant="ghost" onClick={onPause} aria-label="Duraklat">
          <Pause className="size-3" />
        </Button>
      ) : (
        <Button type="button" size="icon-xs" variant="ghost" onClick={onResume} aria-label="Devam et">
          <Play className="size-3" />
        </Button>
      )}
      <Button type="button" size="icon-xs" variant="ghost" onClick={onStop} aria-label="Durdur">
        <Square className="size-3" />
      </Button>
      <Button type="button" size="icon-xs" variant="ghost" onClick={onPlay} aria-label="Tekrar oynat">
        <RotateCcw className="size-3" />
      </Button>
    </div>
  );
}
