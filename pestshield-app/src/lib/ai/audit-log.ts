// PestShield AI Asistan — işlem denetim kaydı (audit log).
//
// Mimari not: uygulamada başka hiçbir modül için de gerçek bir sunucu
// tarafı audit-log tablosu yok; bu da aynı yerel (localStorage) desene
// uyar. API anahtarı, parola, connection string veya kişisel hassas veri
// ASLA loglanmaz — sadece hangi tool'un hangi parametre özetiyle
// çağrıldığı ve sonucun kaç kayıt döndürdüğü tutulur.

import type { AiToolName } from "@/lib/ai/types";

export interface AiAuditEntry {
  id: string;
  userId: string;
  userRole: string;
  question: string;
  tool: AiToolName | null;
  paramSummary: string;
  resultRecordCount: number;
  status: "ok" | "not_found" | "error";
  createdAt: string;
}

const STORAGE_KEY = "pestshield.ai.auditLog";
const MAX_ENTRIES = 500;

function loadAll(): AiAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AiAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function logAiToolCall(entry: Omit<AiAuditEntry, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const next = [{ ...entry, id: `ai-log-${Date.now()}`, createdAt: new Date().toISOString() }, ...loadAll()].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getAiAuditLog(): AiAuditEntry[] {
  return loadAll();
}
