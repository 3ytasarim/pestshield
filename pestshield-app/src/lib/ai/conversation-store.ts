// PestShield AI Asistan — konuşma geçmişi.
//
// Mimari not: uygulamada bu özellik için ayrı bir sunucu tarafı persistence
// katmanı yok (bkz. src/lib/ai/types.ts) — bu yüzden konuşma geçmişi de
// diğer tüm modüller gibi tarayıcı localStorage'ında, kullanıcı bazlı bir
// anahtarla (oturum kullanıcı id'si) tutulur.

import type Anthropic from "@anthropic-ai/sdk";
import type { AiChatMessage } from "@/lib/ai/types";

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  uiMessages: AiChatMessage[];
  /** Claude'a tekrar gönderilecek tam mesaj geçmişi (tool_use/tool_result blokları dahil). */
  anthropicHistory: Anthropic.MessageParam[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = "pestshield.ai.conversations.";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function listConversations(userId: string): AiConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const all = raw ? (JSON.parse(raw) as AiConversation[]) : [];
    return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
}

function saveAll(userId: string, conversations: AiConversation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(conversations));
}

export function getConversation(userId: string, id: string): AiConversation | null {
  return listConversations(userId).find((c) => c.id === id) ?? null;
}

export function createConversation(userId: string): AiConversation {
  const conversation: AiConversation = {
    id: `conv-${Date.now()}`,
    userId,
    title: "Yeni Sohbet",
    uiMessages: [],
    anthropicHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveAll(userId, [conversation, ...listConversations(userId)]);
  return conversation;
}

export function updateConversation(userId: string, id: string, patch: Partial<AiConversation>) {
  const all = listConversations(userId);
  const next = all.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
  saveAll(userId, next);
}

export function deleteConversation(userId: string, id: string) {
  saveAll(userId, listConversations(userId).filter((c) => c.id !== id));
}

/** İlk kullanıcı mesajından kısa bir başlık türetir. */
export function deriveTitle(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed || "Yeni Sohbet";
}
