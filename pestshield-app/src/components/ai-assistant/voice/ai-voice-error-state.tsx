"use client";

import { MicOff, WifiOff, Clock, ShieldAlert, AlertTriangle } from "lucide-react";
import type { VoiceRecognitionErrorKind } from "@/lib/voice/types";

const COPY: Record<VoiceRecognitionErrorKind, { icon: typeof MicOff; text: string }> = {
  permission_denied: { icon: ShieldAlert, text: "Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verip tekrar deneyin." },
  unsupported_browser: { icon: MicOff, text: "Bu tarayıcı sesli komutu desteklemiyor. Lütfen yazarak devam edin." },
  microphone_unavailable: { icon: MicOff, text: "Mikrofon bulunamadı veya başka bir uygulama tarafından kullanılıyor." },
  network_error: { icon: WifiOff, text: "Ses tanıma için ağ bağlantısı kurulamadı." },
  timeout: { icon: Clock, text: "Ses tanıma zaman aşımına uğradı, lütfen tekrar deneyin." },
  no_speech: { icon: AlertTriangle, text: "Konuşma algılanamadı, lütfen tekrar söyleyin." },
  unknown: { icon: AlertTriangle, text: "Ses tanıma sırasında beklenmeyen bir hata oluştu." },
};

export function AiVoiceErrorState({ kind, onRetry, onDismiss }: { kind: VoiceRecognitionErrorKind; onRetry: () => void; onDismiss: () => void }) {
  const { icon: Icon, text } = COPY[kind];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{text}</span>
      {kind !== "unsupported_browser" && (
        <button type="button" onClick={onRetry} className="shrink-0 font-medium underline underline-offset-2">
          Tekrar dene
        </button>
      )}
      <button type="button" onClick={onDismiss} className="shrink-0 text-muted-foreground" aria-label="Kapat">
        ✕
      </button>
    </div>
  );
}
