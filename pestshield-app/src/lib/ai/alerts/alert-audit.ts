// PestShield AI Command Center — Faz 4 uyarı denetim kaydı.
// src/lib/ai/actions/audit.ts ile AYNI desen (kullanıcı bazlı localStorage ring-buffer).

export type AlertAuditEvent = "created" | "acknowledged" | "dismissed" | "snoozed" | "resolved" | "escalated";

export interface AlertAuditEntry {
  id: string;
  userId: string;
  userRole: string;
  alertId: string;
  ruleCode: string;
  event: AlertAuditEvent;
  detail?: string;
  createdAt: string;
}

const STORAGE_PREFIX = "pestshield.alerts.auditLog.";
const MAX_ENTRIES = 300;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadAll(userId: string): AlertAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as AlertAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function logAlertEvent(entry: Omit<AlertAuditEntry, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const next = [{ ...entry, id: `alert-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() }, ...loadAll(entry.userId)].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(storageKey(entry.userId), JSON.stringify(next));
}

export function getAlertAuditLog(userId: string): AlertAuditEntry[] {
  return loadAll(userId);
}
