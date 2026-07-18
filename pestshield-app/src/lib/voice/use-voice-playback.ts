"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTextToSpeechProvider, type VoiceTtsMode } from "@/lib/voice/get-tts-provider";
import type { VoicePlaybackState } from "@/lib/voice/types";

export function useVoicePlayback(mode: VoiceTtsMode, language: string, rate: number) {
  const [state, setState] = useState<VoicePlaybackState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const providerRef = useRef(getTextToSpeechProvider(mode));

  useEffect(() => {
    providerRef.current = getTextToSpeechProvider(mode);
    return () => providerRef.current.stop();
  }, [mode]);

  const play = useCallback(
    (text: string) => {
      setErrorMessage(null);
      if (!providerRef.current.isSupported) {
        setErrorMessage("Bu tarayıcı sesli yanıtı desteklemiyor.");
        setState("error");
        return;
      }
      providerRef.current.speak({
        text,
        language,
        rate,
        onStateChange: setState,
        onError: (message) => {
          setErrorMessage(message);
          setState("error");
        },
      });
    },
    [language, rate],
  );

  const pause = useCallback(() => providerRef.current.pause(), []);
  const resume = useCallback(() => providerRef.current.resume(), []);
  const stop = useCallback(() => {
    providerRef.current.stop();
    setState("stopped");
  }, []);

  const isSupported = providerRef.current.isSupported;

  return { state, errorMessage, isSupported, play, pause, resume, stop };
}
