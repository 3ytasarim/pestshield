// PestShield AI Command Center — Faz 4 WhatsApp mesaj/teslimat geçmişi.
// service-order-store.ts ile AYNI desen (uygulama genelinde, kullanıcı bazlı
// değil — bir müşteriye gönderilen mesaj organizasyonel bir kayıttır).

export type WhatsAppDeliveryStatus = "draft" | "pending_confirmation" | "queued" | "submitted" | "sent" | "delivered" | "read" | "failed" | "rejected" | "cancelled";

export interface WhatsAppMessageRecord {
  id: string;
  proposalId: string;
  providerMessageId: string | null;
  recipientPhone: string;
  recipientName: string;
  templateId: string;
  relatedCustomerId: string | null;
  status: WhatsAppDeliveryStatus;
  failureCode: string | null;
  failureDescription: string | null;
  userId: string;
  submittedAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

const STORAGE_KEY = "pestshield.whatsapp.messages";
const MAX_STORED = 200;

function loadAll(): WhatsAppMessageRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WhatsAppMessageRecord[]) : [];
  } catch {
    return [];
  }
}

function saveAll(records: WhatsAppMessageRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_STORED)));
}

export function listWhatsAppMessages(): WhatsAppMessageRecord[] {
  return loadAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveWhatsAppMessage(record: WhatsAppMessageRecord) {
  const all = loadAll().filter((r) => r.id !== record.id);
  saveAll([record, ...all]);
}

export function getWhatsAppMessageByProposalId(proposalId: string): WhatsAppMessageRecord | null {
  return loadAll().find((r) => r.proposalId === proposalId) ?? null;
}
