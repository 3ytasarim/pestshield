"use client";

// PestShield AI Command Center — Faz 4 ses kaydı durum makinesi.
//
// Bileşenlerden ayrı tutulur (spesifikasyon: "Do not place voice logic
// directly inside the main AI panel component") — bu hook hem AiVoiceRecorder
// hem de ileride başka bir yüzeyde (ör. mobil) yeniden kullanılabilir.
//
// Mikrofon YALNIZCA start() açıkça çağrıldığında etkinleşir (kullanıcı
// tıklaması) — hiçbir otomatik başlatma yoktur.

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechToTextProvider, type VoiceSttMode } from "@/lib/voice/get-stt-provider";
import type { VoiceConfidenceLabel, VoiceRecognitionError } from "@/lib/voice/types";

export type VoiceRecorderState = "idle" | "listening" | "processing" | "review" | "error";

export function useVoiceRecorder(mode: VoiceSttMode, language: string) {
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [confidenceLabel, setConfidenceLabel] = useState<VoiceConfidenceLabel | null>(null);
  const [error, setError] = useState<VoiceRecognitionError | null>(null);
  const providerRef = useRef(getSpeechToTextProvider(mode));

  useEffect(() => {
    providerRef.current = getSpeechToTextProvider(mode);
  }, [mode]);

  const isSupported = providerRef.current.isSupported;

  const start = useCallback(() => {
    setError(null);
    setTranscript("");
    setConfidenceLabel(null);

    if (!providerRef.current.isSupported) {
      setError({ kind: "unsupported_browser", message: "Bu tarayıcı sesli komutu desteklemiyor." });
      setState("error");
      return;
    }

    setState("listening");
    providerRef.current.start({
      language,
      onResult: (result) => {
        setTranscript(result.text);
        setConfidenceLabel(result.confidenceLabel);
        if (result.isFinal) setState("review");
      },
      onError: (err) => {
        setError(err);
        setState("error");
      },
      onEnd: () => {
        setState((s) => (s === "listening" ? "idle" : s));
      },
    });
  }, [language]);

  const stop = useCallback(() => {
    setState((s) => (s === "listening" ? "processing" : s));
    providerRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    providerRef.current.cancel();
    setState("idle");
    setTranscript("");
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTranscript("");
    setError(null);
    setConfidenceLabel(null);
  }, []);

  // Panel kapanırken/bileşen unmount olurken kayıt kesinlikle durur (gizlilik gereksinimi).
  useEffect(() => {
    return () => providerRef.current.cancel();
  }, []);

  return { state, transcript, confidenceLabel, error, isSupported, start, stop, cancel, reset, setTranscript };
}
