// PestShield AI Command Center — Faz 4 uyarı örneği (AlertInstance) deposu.
//
// service-order-store.ts / periyot-store.ts ile AYNI desen: uyarılar
// kullanıcı bazlı değil, uygulama genelinde tek bir localStorage anahtarında
// tutulur — çünkü bir uyarı (ör. "gecikmiş servis") organizasyonel bir
// gerçektir, tek bir kullanıcıya ait UI durumu değildir (proposal-store.ts'in
// aksine). Kimin onayladığı/kapattığı `acknowledgedBy`/`dismissedBy`
// alanlarında ayrıca tutulur.

import type { AlertInstance } from "@/lib/ai/alerts/types";

const STORAGE_KEY = "pestshield.alerts.instances";

function loadAll(): AlertInstance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AlertInstance[]) : [];
  } catch {
    return [];
  }
}

function saveAll(alerts: AlertInstance[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function listAlerts(): AlertInstance[] {
  return loadAll().sort((a, b) => (a.lastDetectedAt < b.lastDetectedAt ? 1 : -1));
}

export function getAlertByDedupKey(key: string): AlertInstance | null {
  return loadAll().find((a) => a.deduplicationKey === key) ?? null;
}

export function upsertAlert(alert: AlertInstance) {
  const all = loadAll().filter((a) => a.id !== alert.id);
  saveAll([alert, ...all]);
}

export function getAlertById(id: string): AlertInstance | null {
  return loadAll().find((a) => a.id === id) ?? null;
}

export function updateAlert(id: string, patch: Partial<AlertInstance>) {
  saveAll(loadAll().map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)));
}
