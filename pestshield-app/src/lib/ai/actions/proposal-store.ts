// PestShield AI Command Center — Faz 3 aksiyon önerisi (proposal) deposu.
//
// Aynı Faz 1/2 deseni: gerçek bir sunucu tarafı proposal tablosu yok, bu
// yüzden öneriler kullanıcı bazlı bir anahtarla localStorage'da tutulur.
// Bu, "sunucuda saklanan güvenilir bir kayıt" DEĞİLDİR — yalnızca UI
// durumunun (hangi öneri hangi aşamada) tarayıcı yenilemeleri arasında
// kaybolmamasını sağlar. Gerçek GÜVENLİK sınırı proposal'ın KENDİSİNDE
// değil, executors.ts'nin sadece "pending_confirmation" durumundaki ve
// süresi dolmamış önerileri yürütmeyi kabul etmesindedir (idempotency).

import type { AiActionProposal } from "@/lib/ai/actions/types";

const STORAGE_PREFIX = "pestshield.ai.actionProposals.";
const MAX_STORED = 50;
const PROPOSAL_TTL_MS = 15 * 60 * 1000; // 15 dakika

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadAll(userId: string): AiActionProposal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as AiActionProposal[]) : [];
  } catch {
    return [];
  }
}

function saveAll(userId: string, proposals: AiActionProposal[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(proposals.slice(0, MAX_STORED)));
}

export function newExpiresAt(): string {
  return new Date(Date.now() + PROPOSAL_TTL_MS).toISOString();
}

export function saveProposal(userId: string, proposal: AiActionProposal) {
  const all = loadAll(userId).filter((p) => p.id !== proposal.id);
  saveAll(userId, [proposal, ...all]);
}

export function getProposal(userId: string, proposalId: string): AiActionProposal | null {
  const found = loadAll(userId).find((p) => p.id === proposalId) ?? null;
  if (!found) return null;
  // Süresi dolmuş ama hâlâ "pending_confirmation" görünen öneriler okunurken otomatik "expired" işaretlenir.
  if (found.status === "pending_confirmation" && new Date(found.expiresAt).getTime() < Date.now()) {
    const expired: AiActionProposal = { ...found, status: "expired" };
    saveProposal(userId, expired);
    return expired;
  }
  return found;
}

export function listProposals(userId: string): AiActionProposal[] {
  return loadAll(userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Onay/yürütme için bir öneriyi "kilitler" — yalnızca hâlâ pending_confirmation
 * durumunda ve süresi dolmamışsa true döner. Bu, çift tıklamada iki kez
 * yürütmeyi (idempotency) engelleyen tek gerçek kontrol noktasıdır.
 */
export function tryConsumeProposal(userId: string, proposalId: string): AiActionProposal | null {
  const proposal = getProposal(userId, proposalId);
  if (!proposal) return null;
  if (proposal.status !== "pending_confirmation") return null;
  const executing: AiActionProposal = { ...proposal, status: "executing", confirmedAt: new Date().toISOString() };
  saveProposal(userId, executing);
  return executing;
}

/** "Tekrar Dene" — yalnızca gerçekten başarısız olmuş (failed) bir öneriyi, AYNI parametrelerle tekrar onaylanabilir hale getirir. Tamamlanmış/iptal/süresi dolmuş önerilerde çalışmaz. */
export function resetProposalForRetry(userId: string, proposalId: string): AiActionProposal | null {
  const proposal = getProposal(userId, proposalId);
  if (!proposal || proposal.status !== "failed") return proposal;
  const reset: AiActionProposal = { ...proposal, status: "pending_confirmation", expiresAt: newExpiresAt(), errorMessage: undefined };
  saveProposal(userId, reset);
  return reset;
}
