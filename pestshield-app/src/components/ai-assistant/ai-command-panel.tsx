"use client";

import { useEffect, useRef } from "react";
import { AiPanelHeader } from "@/components/ai-assistant/ai-panel-header";
import { AiMessageList } from "@/components/ai-assistant/ai-message-list";
import { AiComposer } from "@/components/ai-assistant/ai-composer";
import { AiConversationHistory } from "@/components/ai-assistant/ai-conversation-history";
import { AiReportHistory } from "@/components/ai-assistant/ai-report-history";
import { AiActionHistory } from "@/components/ai-assistant/ai-action-history";
import { AiNotificationPreferences } from "@/components/ai-assistant/ai-notification-preferences";
import type { AiProposalAction } from "@/components/ai-assistant/ai-result-renderer";
import type { AiChatMessage } from "@/lib/ai/types";
import type { AiConversation } from "@/lib/ai/conversation-store";
import type { ReportMetadata } from "@/lib/ai/reports/types";
import type { AiActionAuditEntry } from "@/lib/ai/actions/audit";
import type { VoicePreferences } from "@/lib/voice/voice-preferences-store";
import type { NotificationPreferences } from "@/lib/ai/notifications/preferences-store";

interface AiCommandPanelProps {
  userName: string;
  ready: boolean;
  showHistory: boolean;
  showReports: boolean;
  showActions: boolean;
  showSettings: boolean;
  conversations: AiConversation[];
  reports: ReportMetadata[];
  actionLog: AiActionAuditEntry[];
  activeConversationId: string | undefined;
  messages: AiChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
  onToggleHistory: () => void;
  onToggleReports: () => void;
  onToggleActions: () => void;
  onToggleSettings: () => void;
  onNewConversation: () => void;
  onClose: () => void;
  onPickConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  onRetry: () => void;
  onPickCustomer: (companyName: string) => void;
  onProposalAction: (action: AiProposalAction, proposalId: string) => void;
  voicePreferences: VoicePreferences;
  onVoicePreferencesChange: (patch: Partial<VoicePreferences>) => void;
  sttServerAvailable: boolean;
  ttsServerAvailable: boolean;
  onVoiceSubmit: (text: string) => void;
  notificationPreferences: NotificationPreferences;
  onNotificationPreferencesChange: (patch: Partial<NotificationPreferences>) => void;
}

export function AiCommandPanel({
  userName,
  ready,
  showHistory,
  showReports,
  showActions,
  showSettings,
  conversations,
  reports,
  actionLog,
  activeConversationId,
  messages,
  input,
  loading,
  error,
  onToggleHistory,
  onToggleReports,
  onToggleActions,
  onToggleSettings,
  onNewConversation,
  onClose,
  onPickConversation,
  onDeleteConversation,
  onInputChange,
  onSend,
  onRetry,
  onPickCustomer,
  onProposalAction,
  voicePreferences,
  onVoicePreferencesChange,
  sttServerAvailable,
  ttsServerAvailable,
  onVoiceSubmit,
  notificationPreferences,
  onNotificationPreferencesChange,
}: AiCommandPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:inset-auto sm:right-6 sm:bottom-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="PestShield AI Asistan"
        className="flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl [padding-bottom:env(safe-area-inset-bottom)] sm:h-[min(720px,calc(100vh-3rem))] sm:w-[460px] sm:rounded-2xl sm:border sm:border-border/60 sm:[padding-bottom:0]"
      >
        <AiPanelHeader
          userName={userName}
          ready={ready}
          onToggleHistory={onToggleHistory}
          onToggleReports={onToggleReports}
          onToggleActions={onToggleActions}
          onToggleSettings={onToggleSettings}
          onNewConversation={onNewConversation}
          onClose={onClose}
        />

        {showHistory ? (
          <div className="flex-1 overflow-y-auto">
            <AiConversationHistory conversations={conversations} activeId={activeConversationId} onPick={onPickConversation} onDelete={onDeleteConversation} />
          </div>
        ) : showReports ? (
          <div className="flex-1 overflow-y-auto p-3">
            <AiReportHistory reports={reports} />
          </div>
        ) : showActions ? (
          <div className="flex-1 overflow-y-auto p-3">
            <AiActionHistory entries={actionLog} />
          </div>
        ) : showSettings ? (
          <div className="flex-1 overflow-y-auto">
            <AiNotificationPreferences preferences={notificationPreferences} onChange={onNotificationPreferencesChange} />
          </div>
        ) : (
          <>
            <AiMessageList
              ref={scrollRef}
              messages={messages}
              loading={loading}
              error={error}
              onRetry={onRetry}
              onPickSuggestion={onSend}
              onPickCustomer={onPickCustomer}
              onProposalAction={onProposalAction}
              voicePreferences={voicePreferences}
            />
            <AiComposer
              value={input}
              onChange={onInputChange}
              onSubmit={() => onSend(input)}
              disabled={loading}
              voicePreferences={voicePreferences}
              onVoicePreferencesChange={onVoicePreferencesChange}
              sttServerAvailable={sttServerAvailable}
              ttsServerAvailable={ttsServerAvailable}
              onVoiceSubmit={onVoiceSubmit}
            />
          </>
        )}
      </div>
    </div>
  );
}
