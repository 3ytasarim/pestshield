"use client";

// PestShield AI Command Center — panelin açık/kapalı durumunu paylaşan context.
// command-palette-context.tsx ile AYNI desen: hem üst bardaki "AI" butonu hem
// de yüzen AiCommandButton AYNI durumu kontrol edebilsin diye tek bir kaynak.

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AiPanelContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAiPanel: () => void;
  /** Panel açıldığında composer'a otomatik yazılacak metin — bkz. AI Copilot sayfasındaki hazır öneriler. */
  pendingPrompt: string | null;
  consumePendingPrompt: () => string | null;
  openAiPanelWithPrompt: (prompt: string) => void;
}

const AiPanelContext = createContext<AiPanelContextValue | null>(null);

export function AiPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const openAiPanel = useCallback(() => setOpen(true), []);
  const openAiPanelWithPrompt = useCallback((prompt: string) => {
    setPendingPrompt(prompt);
    setOpen(true);
  }, []);
  const consumePendingPrompt = useCallback(() => {
    let value: string | null = null;
    setPendingPrompt((prev) => {
      value = prev;
      return null;
    });
    return value;
  }, []);
  const value = useMemo(
    () => ({ open, setOpen, openAiPanel, pendingPrompt, consumePendingPrompt, openAiPanelWithPrompt }),
    [open, openAiPanel, pendingPrompt, consumePendingPrompt, openAiPanelWithPrompt],
  );

  return <AiPanelContext.Provider value={value}>{children}</AiPanelContext.Provider>;
}

export function useAiPanel() {
  const ctx = useContext(AiPanelContext);
  if (!ctx) {
    throw new Error("useAiPanel must be used within an AiPanelProvider");
  }
  return ctx;
}
