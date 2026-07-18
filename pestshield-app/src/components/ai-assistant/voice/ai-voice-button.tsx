"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mikrofon YALNIZCA bu butona tıklanınca etkinleşir — panel açılışında veya başka bir otomatik tetikleyicide ASLA başlamaz. */
export function AiVoiceButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" size="icon" variant="outline" onClick={onClick} disabled={disabled} aria-label="Sesli komut ver">
      <Mic className="size-4" />
    </Button>
  );
}
