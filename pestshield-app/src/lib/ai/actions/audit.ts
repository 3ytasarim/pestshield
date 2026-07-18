// PestShield AI Command Center — Faz 3 yazma aksiyonu denetim kaydı.
//
// Faz 1'deki src/lib/ai/audit-log.ts ile aynı desen: gerçek bir sunucu
// audit tablosu yok, bu yüzden localStorage'da, kullanıcı bazlı bir
// anahtarla tutulur. Hiçbir sır (API anahtarı, SMTP parolası vb.)
// loglanmaz. E-posta gövdesi tam olarak saklanmaz — sadece alıcı, konu
// ve şablon kimliği tutulur (bkz. spesifikasyon bölüm 22).

import type { AiActionStatus, AiActionType } from "@/lib/ai/actions/types";

export interface AiActionAuditEntry {
  id: string;
  userId: string;
  userRole: string;
  proposalId: string;
  actionType: AiActionType;
  targetEntityType: string | null;
  targetEntityId: string | null;
  targetEntityName: string | null;
  parametersSummary: string;
  validationPassed: boolean;
  permissionAllowed: boolean;
  resultStatus: AiActionStatus;
  errorMessage?: string;
  createdAt: string;
}

const STORAGE_PREFIX = "pestshield.ai.actionAuditLog.";
const MAX_ENTRIES = 300;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadAll(userId: string): AiActionAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as AiActionAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function logAiAction(entry: Omit<AiActionAuditEntry, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const next = [{ ...entry, id: `ai-action-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() }, ...loadAll(entry.userId)].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(storageKey(entry.userId), JSON.stringify(next));
}

/** Yalnızca çağıran kullanıcının kendi kayıtları döner — başka kullanıcı/tenant kaydı asla karışmaz (bkz. storageKey). */
export function getAiActionAuditLog(userId: string): AiActionAuditEntry[] {
  return loadAll(userId);
}
