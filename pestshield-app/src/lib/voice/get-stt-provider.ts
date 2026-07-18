"use client";

import { BrowserSpeechRecognitionProvider } from "@/lib/voice/providers/browser-speech-recognition-provider";
import { OpenAiSpeechToTextProvider } from "@/lib/voice/providers/openai-speech-to-text-provider";
import type { SpeechToTextProvider } from "@/lib/voice/types";

export type VoiceSttMode = "browser" | "openai";

/** Varsayılan HER ZAMAN tarayıcı — sunucu tabanlı mod yalnızca kullanıcı Ses Ayarları'ndan açıkça seçtiğinde ve sunucu yapılandırıldığında kullanılır (bkz. /api/voice/configuration/status). */
export function getSpeechToTextProvider(mode: VoiceSttMode): SpeechToTextProvider {
  return mode === "openai" ? new OpenAiSpeechToTextProvider() : new BrowserSpeechRecognitionProvider();
}
