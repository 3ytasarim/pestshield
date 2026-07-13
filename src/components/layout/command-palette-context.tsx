"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open, setOpen, openPalette }), [open, openPalette]);

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  }
  return ctx;
}
