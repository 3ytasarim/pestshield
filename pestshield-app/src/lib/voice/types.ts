// PestShield AI Command Center — Faz 4 ses (voice) sağlayıcı soyutlaması.
//
// Faz 3'teki AiModelProvider/AiDataProvider deseninin AYNISI: hiçbir bileşen
// doğrudan tarayıcı SpeechRecognition/SpeechSynthesis API'sini veya bir
// üçüncü parti SDK'yı içe aktarmaz — sadece bu arayüzleri kullanır. Böylece
// gerçek bir sunucu tarafı sağlayıcı (OpenAI/Azure/Google) eklendiğinde UI
// katmanı hiç değişmez.
//
// GÜVENLİK: Sunucu tarafı STT/TTS sağlayıcı API anahtarları ASLA tarayıcıya
// gönderilmez — bu dosyadaki `BrowserSpeechRecognitionProvider`/
// `BrowserSpeechSynthesisProvider` dışındaki tüm implementasyonlar sunucu
// route'ları üzerinden çalışmalıdır (bkz. providers/ altındaki yorumlar).

export type VoiceConfidenceLabel = "net" | "kontrol_gerekli" | "belirsiz" | "tekrar_soyleyin";

export interface VoiceTranscriptionResult {
  text: string;
  /** Sağlayıcı anlamlı bir skor sunmuyorsa null — asla uydurma yüzde gösterilmez. */
  providerConfidence: number | null;
  confidenceLabel: VoiceConfidenceLabel;
  language: string;
  isFinal: boolean;
}

export type VoiceRecognitionErrorKind =
  | "permission_denied"
  | "unsupported_browser"
  | "microphone_unavailable"
  | "network_error"
  | "timeout"
  | "no_speech"
  | "unknown";

export interface VoiceRecognitionError {
  kind: VoiceRecognitionErrorKind;
  message: string;
}

/** Faz 4 STT sağlayıcı arayüzü — hem tarayıcı hem sunucu tabanlı implementasyonlar aynı şekli döndürür. */
export interface SpeechToTextProvider {
  readonly name: string;
  readonly isSupported: boolean;
  start(options: { language: string; onResult: (result: VoiceTranscriptionResult) => void; onError: (error: VoiceRecognitionError) => void; onEnd: () => void }): void;
  stop(): void;
  cancel(): void;
}

export type VoicePlaybackState = "idle" | "playing" | "paused" | "stopped" | "error";

/** Faz 4 TTS sağlayıcı arayüzü. */
export interface TextToSpeechProvider {
  readonly name: string;
  readonly isSupported: boolean;
  speak(options: { text: string; language: string; voiceName?: string; rate?: number; onStateChange: (state: VoicePlaybackState) => void; onError: (message: string) => void }): void;
  pause(): void;
  resume(): void;
  stop(): void;
}

export function confidenceLabelText(label: VoiceConfidenceLabel): string {
  switch (label) {
    case "net":
      return "Net algılandı";
    case "kontrol_gerekli":
      return "Kontrol gerekli";
    case "belirsiz":
      return "Belirsiz ifade";
    case "tekrar_soyleyin":
      return "Tekrar söyleyin";
  }
}

/** Sağlayıcı anlamlı bir skor sunuyorsa etikete çevirir; sunmuyorsa (browser API) her zaman "kontrol_gerekli" — asla uydurma güven göstermez. */
export function labelForConfidence(providerConfidence: number | null): VoiceConfidenceLabel {
  if (providerConfidence === null) return "kontrol_gerekli";
  if (providerConfidence >= 0.85) return "net";
  if (providerConfidence >= 0.55) return "kontrol_gerekli";
  return "belirsiz";
}
