"use client";

// PestShield AI Command Center — Faz 4 sunucu tabanlı STT sağlayıcısı (OpenAI Whisper).
//
// Tarayıcı SpeechRecognition API'sinden farklı olarak burada ses TAMAMEN
// yakalanıp (MediaRecorder) tek seferde /api/voice/transcribe uç noktasına
// yüklenir ve TEK bir nihai sonuç döner (ara/interim sonuç yoktur — Whisper
// akış tabanlı çalışmaz). API anahtarı yalnızca sunucu tarafında kullanılır,
// bu dosya hiçbir zaman bir anahtar görmez.

import { labelForConfidence, type SpeechToTextProvider, type VoiceRecognitionError, type VoiceTranscriptionResult } from "@/lib/voice/types";

const MAX_DURATION_MS = 60_000; // 60 saniye — spesifikasyonun "maksimum süre" gereksinimi

export class OpenAiSpeechToTextProvider implements SpeechToTextProvider {
  readonly name = "openai-whisper";
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private durationTimer: ReturnType<typeof setTimeout> | null = null;
  private cancelled = false;

  get isSupported(): boolean {
    return typeof window !== "undefined" && "mediaDevices" in navigator && typeof MediaRecorder !== "undefined";
  }

  start(options: { language: string; onResult: (result: VoiceTranscriptionResult) => void; onError: (error: VoiceRecognitionError) => void; onEnd: () => void }): void {
    if (!this.isSupported) {
      options.onError({ kind: "unsupported_browser", message: "Bu tarayıcı mikrofon kaydını desteklemiyor." });
      return;
    }
    this.cancelled = false;
    this.chunks = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.stream = stream;
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        this.mediaRecorder = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.chunks.push(e.data);
        };
        recorder.onstop = () => {
          this.releaseStream();
          if (this.cancelled) return;
          void this.uploadAndTranscribe(options);
        };
        recorder.start();
        this.durationTimer = setTimeout(() => this.stop(), MAX_DURATION_MS);
      })
      .catch((err: DOMException) => {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          options.onError({ kind: "permission_denied", message: "Mikrofon izni reddedildi." });
        } else if (err.name === "NotFoundError") {
          options.onError({ kind: "microphone_unavailable", message: "Mikrofon bulunamadı." });
        } else {
          options.onError({ kind: "unknown", message: "Mikrofona erişilemedi." });
        }
      });
  }

  stop(): void {
    if (this.durationTimer) clearTimeout(this.durationTimer);
    this.mediaRecorder?.stop();
  }

  cancel(): void {
    this.cancelled = true;
    if (this.durationTimer) clearTimeout(this.durationTimer);
    this.mediaRecorder?.stop();
    this.releaseStream();
  }

  private releaseStream() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private async uploadAndTranscribe(options: { language: string; onResult: (result: VoiceTranscriptionResult) => void; onError: (error: VoiceRecognitionError) => void; onEnd: () => void }) {
    try {
      const blob = new Blob(this.chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("language", options.language);

      const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Ses metne çevrilemedi." }));
        options.onError({ kind: res.status === 429 ? "network_error" : "unknown", message: body.message ?? "Ses metne çevrilemedi." });
        return;
      }
      const data = (await res.json()) as { text: string };
      options.onResult({
        text: data.text,
        providerConfidence: null, // Whisper API segment-bazlı confidence döndürmez; uydurma yüzde gösterilmez.
        confidenceLabel: labelForConfidence(null),
        language: options.language,
        isFinal: true,
      });
    } catch {
      options.onError({ kind: "network_error", message: "Sunucuya ses yüklenirken bağlantı hatası oluştu." });
    } finally {
      options.onEnd();
    }
  }
}
