"use client";

/** Basit çubuk göstergesi — gerçek mikrofon seviyesini (0-1) yansıtır (bkz. use-audio-level.ts). */
export function AiAudioLevelMeter({ level }: { level: number }) {
  const bars = 5;
  return (
    <div className="flex items-end gap-0.5" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const active = level >= threshold - 0.15;
        return (
          <span
            key={i}
            className="w-1 rounded-full bg-primary transition-all duration-100"
            style={{ height: `${6 + i * 3}px`, opacity: active ? 1 : 0.25 }}
          />
        );
      })}
    </div>
  );
}
