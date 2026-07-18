"use client";

// PestShield AI Command Center — Faz 4 tarayıcı tabanlı TTS sağlayıcısı.
// Web Speech API `speechSynthesis` kullanır — harici sağlayıcı yapılandırılmamışsa
// varsayılan olarak bu kullanılır (bkz. get-tts-provider.ts).

import type { TextToSpeechProvider, VoicePlaybackState } from "@/lib/voice/types";

export class BrowserSpeechSynthesisProvider implements TextToSpeechProvider {
  readonly name = "browser-speech-synthesis";
  private utterance: SpeechSynthesisUtterance | null = null;

  get isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(options: { text: string; language: string; voiceName?: string; rate?: number; onStateChange: (state: VoicePlaybackState) => void; onError: (message: string) => void }): void {
    if (!this.isSupported) {
      options.onError("Bu tarayıcı sesli yanıtı desteklemiyor.");
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(options.text);
    utterance.lang = options.language;
    utterance.rate = options.rate ?? 1;
    if (options.voiceName) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.name === options.voiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => options.onStateChange("playing");
    utterance.onpause = () => options.onStateChange("paused");
    utterance.onresume = () => options.onStateChange("playing");
    utterance.onend = () => options.onStateChange("stopped");
    utterance.onerror = () => {
      options.onStateChange("error");
      options.onError("Sesli yanıt oynatılırken bir hata oluştu.");
    };

    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (this.isSupported) window.speechSynthesis.pause();
  }

  resume(): void {
    if (this.isSupported) window.speechSynthesis.resume();
  }

  stop(): void {
    if (this.isSupported) window.speechSynthesis.cancel();
    this.utterance = null;
  }
}
