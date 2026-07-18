"use client";

import { Switch } from "@/components/ui/switch";
import type { VoicePreferences } from "@/lib/voice/voice-preferences-store";

/** Dil seçici (AiVoiceLanguageSelector) burada tek bir ayarlar panelinde birleştirilmiştir — Faz 4.1 kapsamında yalnızca tr-TR desteklendiği için ayrı bir üst düzey bileşen gereksiz karmaşıklık katardı; alan yine de ileride çoklu dil için genişletilebilir şekilde ayrı tutuldu. */
export function AiVoiceSettings({
  preferences,
  onChange,
  sttServerAvailable,
  ttsServerAvailable,
}: {
  preferences: VoicePreferences;
  onChange: (patch: Partial<VoicePreferences>) => void;
  sttServerAvailable: boolean;
  ttsServerAvailable: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 text-xs">
      <div>
        <p className="mb-1 font-semibold text-foreground">Ses Ayarları</p>
        <p className="text-[11px] text-muted-foreground">Dil: Türkçe (tr-TR)</p>
      </div>

      <label className="flex items-center justify-between gap-2">
        <span>Sesli yanıt oynatma</span>
        <Switch checked={preferences.playbackEnabled} onCheckedChange={(checked: boolean) => onChange({ playbackEnabled: checked })} size="sm" />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">Konuşma tanıma kaynağı</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ sttMode: "browser" })}
            className={`flex-1 rounded-lg border px-2 py-1 text-[11px] ${preferences.sttMode === "browser" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            Tarayıcı
          </button>
          <button
            type="button"
            disabled={!sttServerAvailable}
            onClick={() => onChange({ sttMode: "openai" })}
            className={`flex-1 rounded-lg border px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 ${preferences.sttMode === "openai" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            title={sttServerAvailable ? undefined : "Sunucu tabanlı ses tanıma yapılandırılmamış"}
          >
            Sunucu (OpenAI)
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Tarayıcı modu: ses verisi tarayıcı satıcınızın (Chrome/Safari) kendi sunucusuna gider, PestShield sunucusuna ulaşmaz. Sunucu modu: ses PestShield sunucusu üzerinden OpenAI&apos;ye iletilir, kalıcı olarak
          saklanmaz.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">Sesli yanıt kaynağı</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ttsMode: "browser" })}
            className={`flex-1 rounded-lg border px-2 py-1 text-[11px] ${preferences.ttsMode === "browser" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            Tarayıcı
          </button>
          <button
            type="button"
            disabled={!ttsServerAvailable}
            onClick={() => onChange({ ttsMode: "openai" })}
            className={`flex-1 rounded-lg border px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40 ${preferences.ttsMode === "openai" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            title={ttsServerAvailable ? undefined : "Sunucu tabanlı sesli yanıt yapılandırılmamış"}
          >
            Sunucu (OpenAI)
          </button>
        </div>
      </div>
    </div>
  );
}
