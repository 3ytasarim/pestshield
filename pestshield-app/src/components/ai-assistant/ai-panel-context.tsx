"use client";

// PestShield AI Command Center — panelin açık/kapalı durumunu paylaşan context.
// command-palette-context.tsx ile AYNI desen: hem üst bardaki "AI" butonu hem
// de yüzen AiCommandButton AYNI durumu kontrol edebilsin diye tek bir kaynak.

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AiPanelContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAiPanel: () => void;
}

const AiPanelContext = createContext<AiPanelContextValue | null>(null);

export function AiPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openAiPanel = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open, setOpen, openAiPanel }), [open, openAiPanel]);

  return <AiPanelContext.Provider value={value}>{children}</AiPanelContext.Provider>;
}

export function useAiPanel() {
  const ctx = useContext(AiPanelContext);
  if (!ctx) {
    throw new Error("useAiPanel must be used within an AiPanelProvider");
  }
  return ctx;
}
