// PestShield AI Command Center — Faz 4 uyarı aksiyonları (onayla/kapat/ertele).
//
// ÖNEMLİ: Bu fonksiyonlar SADECE AlertInstance kaydının kendi durumunu
// değiştirir — hiçbiri altta yatan risk/servis/tahsilat/CAPA kaydına
// dokunmaz (spesifikasyon: "Acknowledging an alert must not modify the
// underlying risk, payment, service or corrective action record").

import { getAlertById, updateAlert } from "@/lib/ai/alerts/alert-store";
import { logAlertEvent } from "@/lib/ai/alerts/alert-audit";
import type { AlertInstance } from "@/lib/ai/alerts/types";

export type SnoozeOption = "1h" | "4h" | "tomorrow" | "3d" | "custom";

export function computeSnoozeUntil(option: SnoozeOption, customIso?: string): string {
  const now = new Date();
  switch (option) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case "4h":
      return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    case "3d":
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    case "tomorrow": {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0);
      return tomorrow.toISOString();
    }
    case "custom":
      return customIso ?? now.toISOString();
  }
}

export function acknowledgeAlert(userId: string, role: string, alertId: string): AlertInstance | null {
  const alert = getAlertById(alertId);
  if (!alert || alert.status === "dismissed" || alert.status === "resolved") return alert;
  updateAlert(alertId, { status: "acknowledged", acknowledgedBy: userId, acknowledgedAt: new Date().toISOString() });
  logAlertEvent({ userId, userRole: role, alertId, ruleCode: alert.ruleCode, event: "acknowledged" });
  return getAlertById(alertId);
}

export function dismissAlert(userId: string, role: string, alertId: string): AlertInstance | null {
  const alert = getAlertById(alertId);
  if (!alert) return null;
  updateAlert(alertId, { status: "dismissed", dismissedBy: userId, dismissedAt: new Date().toISOString() });
  logAlertEvent({ userId, userRole: role, alertId, ruleCode: alert.ruleCode, event: "dismissed" });
  return getAlertById(alertId);
}

export function snoozeAlert(userId: string, role: string, alertId: string, option: SnoozeOption, customIso?: string): AlertInstance | null {
  const alert = getAlertById(alertId);
  if (!alert || alert.status === "dismissed" || alert.status === "resolved") return alert;
  const until = computeSnoozeUntil(option, customIso);
  updateAlert(alertId, { status: "snoozed", snoozedUntil: until });
  logAlertEvent({ userId, userRole: role, alertId, ruleCode: alert.ruleCode, event: "snoozed", detail: until });
  return getAlertById(alertId);
}

/** Ertelenmiş uyarılar süresi dolduğunda tekrar "active" görünür — motor her çalıştığında bu kontrol edilir (bkz. engine kullanım noktası). */
export function reactivateExpiredSnoozes(alerts: AlertInstance[]): void {
  const now = Date.now();
  for (const alert of alerts) {
    if (alert.status === "snoozed" && alert.snoozedUntil && new Date(alert.snoozedUntil).getTime() <= now) {
      updateAlert(alert.id, { status: "active", snoozedUntil: null });
    }
  }
}
