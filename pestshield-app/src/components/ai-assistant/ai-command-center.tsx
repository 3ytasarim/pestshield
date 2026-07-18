"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type Anthropic from "@anthropic-ai/sdk";
import { AiCommandButton } from "@/components/ai-assistant/ai-command-button";
import { AiCommandPanel } from "@/components/ai-assistant/ai-command-panel";
import { getAiDataProvider } from "@/lib/ai/providers/get-data-provider";
import { executeAiTool } from "@/lib/ai/tools/executor";
import { todayInTimeZone } from "@/lib/ai/date-parser";
import { logAiToolCall } from "@/lib/ai/audit-log";
import { generateOperationalInsights } from "@/lib/ai/insights/insight-service";
import { listReports, saveReport } from "@/lib/ai/reports/report-store";
import { REPORT_ENGINE_VERSION, type ReportMetadata } from "@/lib/ai/reports/types";
import {
  createConversation,
  deleteConversation,
  deriveTitle,
  getConversation,
  listConversations,
  updateConversation,
  type AiConversation,
} from "@/lib/ai/conversation-store";
import { executeConfirmedAction, cancelProposal } from "@/lib/ai/actions/executors";
import { getProposal, resetProposalForRetry } from "@/lib/ai/actions/proposal-store";
import { getAiActionAuditLog, type AiActionAuditEntry } from "@/lib/ai/actions/audit";
import { getVoicePreferences, saveVoicePreferences, type VoicePreferences } from "@/lib/voice/voice-preferences-store";
import { isValidVoiceConfirmation } from "@/lib/voice/voice-confirmation";
import { getNotificationPreferences, saveNotificationPreferences, type NotificationPreferences } from "@/lib/ai/notifications/preferences-store";
import { useAiPanel } from "@/components/ai-assistant/ai-panel-context";
import { buildDailyBriefing } from "@/lib/ai/notifications/briefing";
import { recordBriefingDelivery, wasBriefingDeliveredToday } from "@/lib/ai/notifications/briefing-store";
import { ProactiveAlertEngine } from "@/lib/ai/alerts/engine";
import type { AiProposalAction } from "@/components/ai-assistant/ai-result-renderer";
import type { AiActionProposal } from "@/lib/ai/actions/types";
import type { AiChatMessage, AiToolName, AiToolResult } from "@/lib/ai/types";

const MAX_TOOL_ROUNDTRIPS = 4;
const REQUEST_TIMEOUT_MS = 25000;

function todayIsoIstanbul(): string {
  const d = todayInTimeZone(new Date(), "Europe/Istanbul");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AiCommandCenter() {
  const { data: session } = useSession();
  const { open, setOpen } = useAiPanel();
  const [ready, setReady] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [actionLog, setActionLog] = useState<AiActionAuditEntry[]>([]);
  const [voicePreferences, setVoicePreferences] = useState<VoicePreferences>({ sttMode: "browser", ttsMode: "browser", playbackEnabled: true, playbackRate: 1 });
  const [sttServerAvailable, setSttServerAvailable] = useState(false);
  const [ttsServerAvailable, setTtsServerAvailable] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    inAppEnabled: true,
    emailEnabled: false,
    whatsappEnabled: false,
    pushEnabled: false,
    voicePlaybackEnabled: true,
    dailyBriefingEnabled: false,
    dailyBriefingTime: "08:00",
    dailyBriefingWeekdaysOnly: false,
    timezone: "Europe/Istanbul",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    minimumSeverity: "info",
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const pendingRetryRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const userId = session?.user?.id;
  const role = session?.user?.role;
  const userName = session?.user?.name ?? "Kullanıcı";

  const provider = getAiDataProvider();

  useEffect(() => {
    if (open && userId && !conversation) {
      const existing = listConversations(userId)[0];
      const next = existing ?? createConversation(userId);
      setConversation(next);
      setConversations(listConversations(userId));
      setReports(listReports(userId));
      setActionLog(getAiActionAuditLog(userId));
      setVoicePreferences(getVoicePreferences(userId));
      setNotificationPreferences(getNotificationPreferences(userId));
      fetch("/api/voice/configuration/status")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setSttServerAvailable(Boolean(data.stt?.openaiAvailable));
            setTtsServerAvailable(Boolean(data.tts?.openaiAvailable));
          }
        })
        .catch(() => {});
      if (next.uiMessages.length === 0) {
        void loadProactiveSummary(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, conversation]);

  if (!userId || !role) return null;

  function persist(uiMessages: AiChatMessage[], anthropicHistory: Anthropic.MessageParam[], titleSeed?: string) {
    if (!userId || !conversation) return;
    const patch: Partial<AiConversation> = { uiMessages, anthropicHistory };
    if (titleSeed && conversation.title === "Yeni Sohbet") patch.title = deriveTitle(titleSeed);
    updateConversation(userId, conversation.id, patch);
    const updated = { ...conversation, ...patch, updatedAt: new Date().toISOString() };
    setConversation(updated);
    setConversations(listConversations(userId));
  }

  async function loadProactiveSummary(conv: AiConversation) {
    try {
      const result = await executeAiTool(provider, "get_today_summary", {}, todayIsoIstanbul());
      const uiMessages: AiChatMessage[] = [{ role: "assistant", content: result.message, toolResult: result }];

      try {
        const insights = await generateOperationalInsights(provider, todayIsoIstanbul());
        if (insights.length > 0) {
          uiMessages.push({
            role: "assistant",
            content: "Bugün dikkat etmeniz gereken öncelikli konular:",
            toolResult: { responseType: "proactive_insights", message: "Bugün dikkat etmeniz gereken öncelikli konular:", insights, source: { recordCount: insights.length } },
          });
        }
      } catch {
        // Proaktif içgörüler başarısız olursa sessizce geç — günlük özet yine de gösterilir.
      }

      // Faz 4 — günlük brifing: kullanıcı açıkça etkinleştirdiyse ve bugün için
      // henüz teslim edilmediyse (dedup, bkz. briefing-store.ts) gösterilir.
      if (userId) {
        try {
          const todayIso = todayIsoIstanbul();
          const prefs = getNotificationPreferences(userId);
          const isWeekday = new Date(todayIso).getDay() % 6 !== 0;
          if (prefs.dailyBriefingEnabled && !wasBriefingDeliveredToday(userId, todayIso) && (!prefs.dailyBriefingWeekdaysOnly || isWeekday)) {
            await ProactiveAlertEngine.evaluate(provider, todayIso);
            const briefing = await buildDailyBriefing(provider, todayIso);
            uiMessages.push({
              role: "assistant",
              content: briefing.summaryText,
              toolResult: { responseType: "summary", message: briefing.summaryText, kpis: briefing.kpis, source: { recordCount: briefing.kpis.length, dateFrom: todayIso, dateTo: todayIso } },
            });
            recordBriefingDelivery(userId, todayIso, ["in_app"]);
          }
        } catch {
          // Brifing başarısız olursa sessizce geç — günlük özet/içgörüler yine de gösterilir.
        }
      }

      if (userId) {
        updateConversation(userId, conv.id, { uiMessages });
        setConversation({ ...conv, uiMessages });
      }
    } catch {
      // Proaktif özet başarısız olursa sessizce geç — kullanıcı yine de soru sorabilir.
    }
  }

  async function runToolLoop(anthropicHistory: Anthropic.MessageParam[], uiMessages: AiChatMessage[], question: string, signal: AbortSignal) {
    let history = anthropicHistory;
    let lastToolResult: AiToolResult | undefined;
    let lastToolName: AiToolName | null = null;

    for (let round = 0; round < MAX_TOOL_ROUNDTRIPS; round++) {
      let res: Response;
      try {
        res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        throw new Error("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: "Bilinmeyen hata" }));
        if (res.status === 503) setReady(false);
        throw new Error(errBody.message ?? `İstek başarısız oldu (${res.status}).`);
      }

      const data = await res.json();

      if (data.type === "tool_use") {
        history = [...history, data.assistantMessage];
        const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
        for (const call of data.calls as { id: string; name: AiToolName; input: Record<string, unknown> }[]) {
          let toolResult: AiToolResult;
          try {
            toolResult = await executeAiTool(provider, call.name, call.input, todayIsoIstanbul(), userId && role ? { userId, role } : undefined);
          } catch {
            toolResult = { responseType: "error", message: "Tool çalıştırılırken bir hata oluştu.", source: { recordCount: 0 } };
          }
          lastToolResult = toolResult;
          lastToolName = call.name;
          if (toolResult.responseType === "report_result" && toolResult.report && userId) {
            const r = toolResult.report;
            const metadata: ReportMetadata = {
              id: r.reportId,
              userId,
              reportType: "operational_summary",
              title: r.title,
              entityType: r.reportData?.scope ?? "company",
              entityId: null,
              entityName: r.entityName ?? null,
              dateFrom: r.period.from,
              dateTo: r.period.to,
              status: r.status,
              summary: toolResult.message,
              createdAt: r.createdAt,
              completedAt: r.status === "completed" ? r.createdAt : undefined,
              reportVersion: REPORT_ENGINE_VERSION,
              sourceRecordCount: toolResult.source.recordCount,
              reportData: r.reportData,
            };
            saveReport(userId, metadata);
            setReports(listReports(userId));
          }
          logAiToolCall({
            userId: userId!,
            userRole: role!,
            question,
            tool: call.name,
            paramSummary: JSON.stringify(call.input).slice(0, 200),
            resultRecordCount: toolResult.source.recordCount,
            status: toolResult.responseType === "error" ? "error" : toolResult.responseType === "empty_state" ? "not_found" : "ok",
          });
          toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(toolResult) });
        }
        history = [...history, { role: "user", content: toolResultBlocks }];
        continue;
      }

      history = [...history, data.assistantMessage];
      const finalUiMessages: AiChatMessage[] = [
        ...uiMessages,
        { role: "assistant", content: data.text || "İşleminiz tamamlandı.", toolResult: lastToolName ? lastToolResult : undefined },
      ];
      persist(finalUiMessages, history, question);
      return;
    }

    throw new Error("İşlem çok uzun sürdü, lütfen sorunuzu daha spesifik hale getirip tekrar deneyin.");
  }

  async function handleSend(text: string) {
    const question = text.trim();
    if (!question || loading || !conversation || inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);
    setInput("");
    pendingRetryRef.current = question;

    const uiMessages: AiChatMessage[] = [...conversation.uiMessages, { role: "user", content: question }];
    const anthropicHistory: Anthropic.MessageParam[] = [...conversation.anthropicHistory, { role: "user", content: question }];
    persist(uiMessages, anthropicHistory, question);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    setLoading(true);
    try {
      await runToolLoop(anthropicHistory, uiMessages, question, controller.signal);
      pendingRetryRef.current = null;
      if (!open) setHasUnread(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("İstek zaman aşımına uğradı. Lütfen tekrar deneyin.");
      } else {
        setError(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  function handleOpen() {
    setOpen(true);
    setHasUnread(false);
  }

  function handleClose() {
    setOpen(false);
    abortRef.current?.abort();
  }

  function handleNewConversation() {
    if (!userId) return;
    const next = createConversation(userId);
    setConversation(next);
    setConversations(listConversations(userId));
    setShowHistory(false);
    setShowReports(false);
    setShowActions(false);
    setShowSettings(false);
    setError(null);
    void loadProactiveSummary(next);
  }

  function handlePickConversation(id: string) {
    if (!userId) return;
    const found = getConversation(userId, id);
    if (found) setConversation(found);
    setShowHistory(false);
    setShowReports(false);
    setShowActions(false);
    setShowSettings(false);
  }

  function handleDeleteConversation(id: string) {
    if (!userId) return;
    deleteConversation(userId, id);
    setConversations(listConversations(userId));
    if (conversation?.id === id) setConversation(null);
  }

  function handlePickCustomer(companyName: string) {
    void handleSend(companyName);
  }

  function applyProposalUpdate(updated: AiActionProposal) {
    if (!userId || !conversation) return;
    const nextMessages = conversation.uiMessages.map((m) =>
      m.toolResult?.responseType === "action_proposal" && m.toolResult.proposal?.id === updated.id
        ? { ...m, toolResult: { ...m.toolResult, proposal: updated } }
        : m,
    );
    updateConversation(userId, conversation.id, { uiMessages: nextMessages });
    setConversation((prev) => (prev ? { ...prev, uiMessages: nextMessages } : prev));
    setActionLog(getAiActionAuditLog(userId));
  }

  async function handleProposalAction(action: AiProposalAction, proposalId: string) {
    if (!userId || !role) return;

    if (action === "cancel") {
      const updated = cancelProposal(userId, proposalId);
      if (updated) applyProposalUpdate(updated);
      return;
    }

    if (action === "edit") {
      setInput(`Bu öneriyi düzeltmek istiyorum: `);
      return;
    }

    // confirm / retry — GERÇEK yazma işlemi burada başlar, yalnızca bu
    // fonksiyon kullanıcının panelde bastığı bir düğmeden çağrılır. Önce
    // "İşlem uygulanıyor" durumunu yansıtmak için mevcut öneriyi "executing"
    // olarak işaretleriz (iyimser BAŞARI değil, sadece ilerleme göstergesi);
    // gerçek sonuç executeConfirmedAction'ın döndürdüğü nihai proposal'dır.
    if (action === "retry") {
      const reset = resetProposalForRetry(userId, proposalId);
      if (!reset) return;
    }
    const inProgress = getProposal(userId, proposalId);
    if (inProgress) applyProposalUpdate({ ...inProgress, status: "executing" });
    const result = await executeConfirmedAction(userId, role, proposalId);
    if (result) applyProposalUpdate(result);
  }

  function handleVoicePreferencesChange(patch: Partial<VoicePreferences>) {
    if (!userId) return;
    const next = { ...voicePreferences, ...patch };
    setVoicePreferences(next);
    saveVoicePreferences(userId, next);
  }

  function handleNotificationPreferencesChange(patch: Partial<NotificationPreferences>) {
    if (!userId) return;
    const next = { ...notificationPreferences, ...patch };
    setNotificationPreferences(next);
    saveNotificationPreferences(userId, next);
  }

  /**
   * Sesle onaylanan (transkript düzenlenip "Gönder"e basılan) metin. Faz 3
   * onay kuralı burada da AYNEN korunur: yalnızca ekranda hâlâ görünen ve
   * pending_confirmation durumundaki EN SON öneri, tanımlı sabit onay
   * ifadelerinden biriyle eşleşirse doğrudan onay tetiklenir (bkz.
   * voice-confirmation.ts) — LLM bu kararı hiçbir zaman vermez. Diğer her
   * durumda metin normal sohbet akışına (handleSend) girer; bu da voice'un
   * yeni bir yürütme yolu AÇMADIĞI, sadece composer'a alternatif bir GİRİŞ
   * yöntemi olduğu anlamına gelir.
   */
  function handleVoiceSubmit(text: string) {
    const lastMessage = conversation?.uiMessages.at(-1);
    const activeProposal = lastMessage?.toolResult?.responseType === "action_proposal" ? lastMessage.toolResult.proposal : undefined;

    if (activeProposal && activeProposal.status === "pending_confirmation" && isValidVoiceConfirmation(text)) {
      void handleProposalAction("confirm", activeProposal.id);
      return;
    }

    void handleSend(text);
  }

  return (
    <>
      <AiCommandButton open={open} hasUnread={hasUnread} onClick={handleOpen} />
      {open && (
        <AiCommandPanel
          userName={userName}
          ready={ready}
          showHistory={showHistory}
          showReports={showReports}
          showActions={showActions}
          showSettings={showSettings}
          conversations={conversations}
          reports={reports}
          actionLog={actionLog}
          activeConversationId={conversation?.id}
          messages={conversation?.uiMessages ?? []}
          input={input}
          loading={loading}
          error={error}
          onToggleHistory={() => {
            setShowReports(false);
            setShowActions(false);
            setShowSettings(false);
            setShowHistory((v) => !v);
          }}
          onToggleReports={() => {
            setShowHistory(false);
            setShowActions(false);
            setShowSettings(false);
            setShowReports((v) => !v);
          }}
          onToggleActions={() => {
            setShowHistory(false);
            setShowReports(false);
            setShowSettings(false);
            setShowActions((v) => !v);
          }}
          onToggleSettings={() => {
            setShowHistory(false);
            setShowReports(false);
            setShowActions(false);
            setShowSettings((v) => !v);
          }}
          onNewConversation={handleNewConversation}
          onClose={handleClose}
          onPickConversation={handlePickConversation}
          onDeleteConversation={handleDeleteConversation}
          onInputChange={setInput}
          onSend={handleSend}
          onRetry={() => pendingRetryRef.current && handleSend(pendingRetryRef.current)}
          onPickCustomer={handlePickCustomer}
          onProposalAction={handleProposalAction}
          voicePreferences={voicePreferences}
          onVoicePreferencesChange={handleVoicePreferencesChange}
          sttServerAvailable={sttServerAvailable}
          ttsServerAvailable={ttsServerAvailable}
          onVoiceSubmit={handleVoiceSubmit}
          notificationPreferences={notificationPreferences}
          onNotificationPreferencesChange={handleNotificationPreferencesChange}
        />
      )}
    </>
  );
}
