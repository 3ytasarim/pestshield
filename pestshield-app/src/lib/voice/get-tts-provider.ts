"use client";

import { BrowserSpeechSynthesisProvider } from "@/lib/voice/providers/browser-speech-synthesis-provider";
import { OpenAiTextToSpeechProvider } from "@/lib/voice/providers/openai-text-to-speech-provider";
import type { TextToSpeechProvider } from "@/lib/voice/types";

export type VoiceTtsMode = "browser" | "openai";

export function getTextToSpeechProvider(mode: VoiceTtsMode): TextToSpeechProvider {
  return mode === "openai" ? new OpenAiTextToSpeechProvider() : new BrowserSpeechSynthesisProvider();
}
