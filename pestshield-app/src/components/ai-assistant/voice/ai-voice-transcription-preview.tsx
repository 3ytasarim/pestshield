"use client";

import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { confidenceLabelText } from "@/lib/voice/types";
import type { VoiceConfidenceLabel } from "@/lib/voice/types";

export function AiVoiceTranscriptionPreview({
  text,
  onChange,
  confidenceLabel,
  onSubmit,
  onCancel,
}: {
  text: string;
  onChange: (value: string) => void;
  confidenceLabel: VoiceConfidenceLabel | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase">Algılanan metin</span>
        {confidenceLabel && (
          <Badge variant={confidenceLabel === "net" ? "secondary" : "outline"} className="text-[10px]">
            {confidenceLabelText(confidenceLabel)}
          </Badge>
        )}
      </div>
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sesli algılanan metni düzenleyin"
        className="max-h-32 min-h-16 resize-none rounded-lg text-sm"
        autoFocus
      />
      <div className="flex justify-end gap-1.5">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-3.5" />
          İptal
        </Button>
        <Button type="button" size="sm" onClick={onSubmit} disabled={!text.trim()}>
          <Send className="size-3.5" />
          Gönder
        </Button>
      </div>
    </div>
  );
}
