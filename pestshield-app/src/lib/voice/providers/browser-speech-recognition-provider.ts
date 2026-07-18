"use client";

// PestShield AI Command Center — Faz 4 tarayıcı tabanlı STT sağlayıcısı.
//
// Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`) kullanır.
// Yalnızca Chrome/Edge/Safari (kısmi) destekler — Firefox desteklemez.
// GİZLİLİK: Bu API'de ses verisi tarayıcıdan doğrudan tarayıcı satıcısının
// (Google/Apple) kendi sunucusuna gönderilir — PestShield sunucusuna hiçbir
// ses verisi ulaşmaz, sadece nihai metin sonucu bu sağlayıcıya döner.
// Bu davranış tarayıcı satıcısına bağlıdır, PestShield tarafından kontrol
// edilemez; bu yüzden Ayarlar ekranında açıkça belirtilir (bkz.
// AiVoiceSettings).

import { labelForConfidence, type SpeechToTextProvider, type VoiceRecognitionError, type VoiceTranscriptionResult } from "@/lib/voice/types";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapError(code: string): VoiceRecognitionError {
  switch (code) {
    case "not-allowed":
    case "permission-denied":
      return { kind: "permission_denied", message: "Mikrofon izni reddedildi." };
    case "audio-capture":
      return { kind: "microphone_unavailable", message: "Mikrofon bulunamadı veya kullanılamıyor." };
    case "network":
      return { kind: "network_error", message: "Ses tanıma için ağ bağlantısı kurulamadı." };
    case "no-speech":
      return { kind: "no_speech", message: "Konuşma algılanamadı." };
    default:
      return { kind: "unknown", message: "Ses tanıma sırasında beklenmeyen bir hata oluştu." };
  }
}

export class BrowserSpeechRecognitionProvider implements SpeechToTextProvider {
  readonly name = "browser-speech-recognition";
  private recognition: SpeechRecognitionLike | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  get isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  start(options: { language: string; onResult: (result: VoiceTranscriptionResult) => void; onError: (error: VoiceRecognitionError) => void; onEnd: () => void }): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      options.onError({ kind: "unsupported_browser", message: "Bu tarayıcı sesli komutu desteklemiyor." });
      return;
    }

    const recognition = new Ctor();
    recognition.lang = options.language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      this.resetTimeout(options.onError);
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result[0] ?? result.item(0);
        const providerConfidence = typeof alt.confidence === "number" && alt.confidence > 0 ? alt.confidence : null;
        options.onResult({
          text: alt.transcript,
          providerConfidence,
          confidenceLabel: labelForConfidence(providerConfidence),
          language: options.language,
          isFinal: result.isFinal,
        });
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      this.clearTimeout();
      options.onError(mapError(event.error));
    };
    recognition.onend = () => {
      this.clearTimeout();
      options.onEnd();
    };

    this.recognition = recognition;
    this.resetTimeout(options.onError);
    try {
      recognition.start();
    } catch {
      options.onError({ kind: "unknown", message: "Ses tanıma başlatılamadı." });
    }
  }

  stop(): void {
    this.clearTimeout();
    this.recognition?.stop();
  }

  cancel(): void {
    this.clearTimeout();
    this.recognition?.abort();
  }

  private resetTimeout(onError: (error: VoiceRecognitionError) => void) {
    this.clearTimeout();
    // 15 saniye içinde hiçbir sonuç/hata gelmezse zaman aşımı — mikrofon sonsuza kadar açık kalmaz.
    this.timeoutHandle = setTimeout(() => {
      this.cancel();
      onError({ kind: "timeout", message: "Ses tanıma zaman aşımına uğradı." });
    }, 15_000);
  }

  private clearTimeout() {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }
}
