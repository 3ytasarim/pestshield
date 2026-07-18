"use client";

import { ShieldCheck } from "lucide-react";
import { MarkdownLite } from "@/lib/ai/markdown-lite";
import { AiResultRenderer, type AiProposalAction } from "@/components/ai-assistant/ai-result-renderer";
import { AiVoicePlaybackControls } from "@/components/ai-assistant/voice/ai-voice-playback-controls";
import { useVoicePlayback } from "@/lib/voice/use-voice-playback";
import { buildSpokenSummary } from "@/lib/voice/spoken-summary";
import type { VoicePreferences } from "@/lib/voice/voice-preferences-store";
import type { AiChatMessage } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

export function AiAssistantMessage({
  message,
  onPickCustomer,
  onProposalAction,
  voicePreferences,
}: {
  message: AiChatMessage;
  onPickCustomer: (companyName: string) => void;
  onProposalAction: (action: AiProposalAction, proposalId: string) => void;
  voicePreferences: VoicePreferences;
}) {
  const isError = message.toolResult?.responseType === "error";
  const playback = useVoicePlayback(voicePreferences.ttsMode, "tr-TR", voicePreferences.playbackRate);
  const canPlay = voicePreferences.playbackEnabled && message.toolResult && message.toolResult.responseType !== "error" && message.toolResult.responseType !== "action_proposal";

  return (
    <div className="flex gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
      </div>
      <div className="flex max-w-[85%] flex-col gap-2">
        <div className={cn("rounded-2xl bg-muted/60 px-3.5 py-2.5 text-sm text-foreground", isError && "border border-destructive/30 bg-destructive/5")}>
          <MarkdownLite text={message.content} />
        </div>
        {message.toolResult && (
          <div className="w-full">
            <AiResultRenderer result={message.toolResult} onPickCustomer={onPickCustomer} onProposalAction={onProposalAction} />
          </div>
        )}
        {canPlay && message.toolResult && (
          <AiVoicePlaybackControls
            state={playback.state}
            onPlay={() => playback.play(buildSpokenSummary(message.toolResult!))}
            onPause={playback.pause}
            onResume={playback.resume}
            onStop={playback.stop}
          />
        )}
      </div>
    </div>
  );
}
