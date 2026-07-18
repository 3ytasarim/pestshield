// PestShield AI Command Center — Faz 4 brifing teslimat geçmişi.
// Aynı kullanıcı+tarih için aynı brifing İKİ KEZ teslim edilmez (spesifikasyon:
// "Do not send duplicate briefings for the same date and user").

export type BriefingChannel = "in_app" | "email" | "whatsapp" | "voice";

export interface BriefingDeliveryRecord {
  id: string;
  userId: string;
  dateIso: string;
  channels: BriefingChannel[];
  deliveredAt: string;
}

const STORAGE_PREFIX = "pestshield.notifications.briefingHistory.";
const MAX_ENTRIES = 90;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadAll(userId: string): BriefingDeliveryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as BriefingDeliveryRecord[]) : [];
  } catch {
    return [];
  }
}

export function wasBriefingDeliveredToday(userId: string, dateIso: string): boolean {
  return loadAll(userId).some((r) => r.dateIso === dateIso);
}

export function recordBriefingDelivery(userId: string, dateIso: string, channels: BriefingChannel[]) {
  if (typeof window === "undefined") return;
  if (wasBriefingDeliveredToday(userId, dateIso)) return;
  const record: BriefingDeliveryRecord = {
    id: `briefing-${Date.now()}`,
    userId,
    dateIso,
    channels,
    deliveredAt: new Date().toISOString(),
  };
  const next = [record, ...loadAll(userId)].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
}

export function listBriefingHistory(userId: string): BriefingDeliveryRecord[] {
  return loadAll(userId).sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1));
}
