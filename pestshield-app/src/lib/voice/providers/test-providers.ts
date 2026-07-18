// PestShield AI Command Center — Faz 4 test amaçlı deterministik ses sağlayıcıları.
// Gerçek mikrofon/hoparlör gerektirmez — birim testlerinde ve sağlayıcı
// yapılandırılmamışken (ör. CI ortamı) kullanılır.

import type { SpeechToTextProvider, TextToSpeechProvider, VoicePlaybackState, VoiceRecognitionError, VoiceTranscriptionResult } from "@/lib/voice/types";

export class TestSpeechToTextProvider implements SpeechToTextProvider {
  readonly name = "test-stt";
  readonly isSupported = true;
  constructor(private readonly fixedResult: VoiceTranscriptionResult | VoiceRecognitionError) {}

  start(options: { onResult: (result: VoiceTranscriptionResult) => void; onError: (error: VoiceRecognitionError) => void; onEnd: () => void }): void {
    if ("kind" in this.fixedResult) options.onError(this.fixedResult);
    else options.onResult(this.fixedResult);
    options.onEnd();
  }
  stop(): void {}
  cancel(): void {}
}

export class TestTextToSpeechProvider implements TextToSpeechProvider {
  readonly name = "test-tts";
  readonly isSupported = true;
  public lastSpokenText: string | null = null;

  speak(options: { text: string; onStateChange: (state: VoicePlaybackState) => void }): void {
    this.lastSpokenText = options.text;
    options.onStateChange("playing");
    options.onStateChange("stopped");
  }
  pause(): void {}
  resume(): void {}
  stop(): void {}
}
