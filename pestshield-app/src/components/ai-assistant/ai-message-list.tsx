"use client";

import { forwardRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiWelcomeState } from "@/components/ai-assistant/ai-welcome-state";
import { AiUserMessage } from "@/components/ai-assistant/ai-user-message";
import { AiAssistantMessage } from "@/components/ai-assistant/ai-assistant-message";
import { AiTypingIndicator } from "@/components/ai-assistant/ai-typing-indicator";
import { AiErrorState } from "@/components/ai-assistant/ai-error-state";
import type { AiProposalAction } from "@/components/ai-assistant/ai-result-renderer";
import type { AiChatMessage } from "@/lib/ai/types";
import type { VoicePreferences } from "@/lib/voice/voice-preferences-store";

interface AiMessageListProps {
  messages: AiChatMessage[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPickSuggestion: (question: string) => void;
  onPickCustomer: (companyName: string) => void;
  onProposalAction: (action: AiProposalAction, proposalId: string) => void;
  voicePreferences: VoicePreferences;
}

export const AiMessageList = forwardRef<HTMLDivElement, AiMessageListProps>(function AiMessageList(
  { messages, loading, error, onRetry, onPickSuggestion, onPickCustomer, onProposalAction, voicePreferences },
  ref,
) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div ref={ref} className="flex flex-col gap-4 p-4" role="log" aria-live="polite" aria-label="Sohbet mesajları">
        {messages.length === 0 && <AiWelcomeState onPick={onPickSuggestion} />}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <AiUserMessage key={i} content={m.content} />
          ) : (
            <AiAssistantMessage key={i} message={m} onPickCustomer={onPickCustomer} onProposalAction={onProposalAction} voicePreferences={voicePreferences} />
          ),
        )}
        {loading && <AiTypingIndicator />}
        {error && <AiErrorState message={error} onRetry={onRetry} />}
      </div>
    </ScrollArea>
  );
});
