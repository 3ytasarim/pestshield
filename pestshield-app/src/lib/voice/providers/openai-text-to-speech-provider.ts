"use client";

// PestShield AI Command Center — Faz 4 sunucu tabanlı TTS sağlayıcısı (OpenAI).
// Metni /api/voice/speak'e gönderir, dönen ses akışını <audio> ile çalar.

import type { TextToSpeechProvider, VoicePlaybackState } from "@/lib/voice/types";

export class OpenAiTextToSpeechProvider implements TextToSpeechProvider {
  readonly name = "openai-tts";
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;

  get isSupported(): boolean {
    return typeof window !== "undefined" && typeof Audio !== "undefined";
  }

  speak(options: { text: string; language: string; voiceName?: string; rate?: number; onStateChange: (state: VoicePlaybackState) => void; onError: (message: string) => void }): void {
    this.stop();
    fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: options.text, voice: options.voiceName }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({ message: "Sesli yanıt üretilemedi." }));
          throw new Error(body.message ?? "Sesli yanıt üretilemedi.");
        }
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        this.objectUrl = url;
        const audio = new Audio(url);
        audio.playbackRate = options.rate ?? 1;
        audio.onplay = () => options.onStateChange("playing");
        audio.onpause = () => options.onStateChange("paused");
        audio.onended = () => options.onStateChange("stopped");
        audio.onerror = () => options.onError("Sesli yanıt oynatılırken bir hata oluştu.");
        this.audio = audio;
        void audio.play();
      })
      .catch((err: Error) => options.onError(err.message));
  }

  pause(): void {
    this.audio?.pause();
  }

  resume(): void {
    void this.audio?.play();
  }

  stop(): void {
    this.audio?.pause();
    this.audio = null;
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
