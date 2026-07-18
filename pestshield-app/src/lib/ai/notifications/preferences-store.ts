// PestShield AI Command Center — Faz 4 kullanıcı bildirim tercihleri.
// src/lib/ai/actions/audit.ts ile AYNI kullanıcı bazlı localStorage deseni.

export type AlertSeverityLevel = "info" | "warning" | "high" | "critical";

export interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
  voicePlaybackEnabled: boolean;
  dailyBriefingEnabled: boolean;
  dailyBriefingTime: string; // "HH:mm"
  dailyBriefingWeekdaysOnly: boolean;
  timezone: string;
  quietHoursStart: string | null; // "HH:mm" veya null (kapalı)
  quietHoursEnd: string | null;
  minimumSeverity: AlertSeverityLevel;
}

const STORAGE_PREFIX = "pestshield.notifications.preferences.";

const DEFAULTS: NotificationPreferences = {
  inAppEnabled: true,
  emailEnabled: false,
  whatsappEnabled: false,
  pushEnabled: false, // Not: gerçek push altyapısı (service worker) henüz yok — bkz. final rapor bilinen sınırlamalar.
  voicePlaybackEnabled: true,
  dailyBriefingEnabled: false,
  dailyBriefingTime: "08:00",
  dailyBriefingWeekdaysOnly: false,
  timezone: "Europe/Istanbul",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  minimumSeverity: "info",
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getNotificationPreferences(userId: string): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveNotificationPreferences(userId: string, prefs: NotificationPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
}

/** "HH:mm" karşılaştırması — sessiz saatler gece yarısını geçebilir (ör. 22:00–07:00). */
export function isWithinQuietHours(prefs: NotificationPreferences, nowHHmm: string): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;
  const { quietHoursStart: start, quietHoursEnd: end } = prefs;
  if (start === end) return false;
  if (start < end) return nowHHmm >= start && nowHHmm < end;
  return nowHHmm >= start || nowHHmm < end; // gece yarısını geçen aralık
}

const SEVERITY_RANK: Record<AlertSeverityLevel, number> = { info: 0, warning: 1, high: 2, critical: 3 };

export function meetsMinimumSeverity(prefs: NotificationPreferences, severity: AlertSeverityLevel): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[prefs.minimumSeverity];
}
