// PestShield AI Command Center — Faz 4 kullanıcı bazlı ses tercihleri.
// proposal-store.ts ile AYNI desen: kullanıcı bazlı localStorage anahtarı.
// Bildirim kanalı tercihleri (WhatsApp/e-posta/sesli günlük özet açık mı)
// AYRI bir store'dadır (bkz. src/lib/ai/notifications/preferences-store.ts) —
// burası SADECE ses kaydı/oynatma bileşeninin kendi teknik ayarlarını tutar.

export interface VoicePreferences {
  sttMode: "browser" | "openai";
  ttsMode: "browser" | "openai";
  playbackEnabled: boolean;
  playbackRate: number;
}

const STORAGE_PREFIX = "pestshield.ai.voicePreferences.";

const DEFAULTS: VoicePreferences = {
  sttMode: "browser",
  ttsMode: "browser",
  playbackEnabled: true,
  playbackRate: 1,
};

export function getVoicePreferences(userId: string): VoicePreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveVoicePreferences(userId: string, prefs: VoicePreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(prefs));
}
