"use client";

// PestShield AI Command Center — Faz 4 gerçek zamanlı mikrofon seviyesi.
// Yalnızca `active` true iken mikrofona erişir; kapanınca stream anında
// serbest bırakılır (gizlilik: sürekli arka plan dinleme YOKTUR).

import { useEffect, useRef, useState } from "react";

export function useAudioLevel(active: boolean): number {
  const [level, setLevel] = useState(0);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.mediaDevices) {
      setLevel(0);
      return;
    }

    let audioContext: AudioContext | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
          setLevel(Math.min(1, avg / 128));
          frameRef.current = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => setLevel(0));

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      void audioContext?.close();
      setLevel(0);
    };
  }, [active]);

  return level;
}
