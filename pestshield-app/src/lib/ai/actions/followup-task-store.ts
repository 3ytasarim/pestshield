// PestShield — takip görevi (follow-up task) deposu.
//
// Uygulamada daha önce hiçbir görev/hatırlatma veri modeli yoktu — bu,
// AI Command Center Faz 3'ün create_followup_task aksiyonu için gereken,
// gerçek ve yeni bir özelliktir (uydurulmuş veri değildir). Diğer iş
// verisi store'ları (service-order-store.ts, periyot-store.ts) ile AYNI
// desen: kullanıcı bazlı değil, uygulama genelinde tek localStorage anahtarı
// (görevler AI panelinin dışında da, örn. ileride bir "Görevler" sayfasında
// görüntülenebilir olmalı — bu yüzden Faz 3'ün diğer parçaları gibi (proposal/
// audit) kullanıcıya özel DEĞİLDİR).

export type FollowupTaskPriority = "low" | "normal" | "high";
export type FollowupTaskStatus = "open" | "done";

export interface FollowupTask {
  id: string;
  title: string;
  description: string;
  relatedEntityType?: "customer" | "risk" | "invoice";
  relatedEntityId?: string;
  relatedEntityName?: string;
  dueDate: string;
  responsible: string;
  priority: FollowupTaskPriority;
  status: FollowupTaskStatus;
  createdByUserId: string;
  createdAt: string;
}

const STORAGE_KEY = "pestshield.crm.followupTasks";

function loadAll(): FollowupTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FollowupTask[]) : [];
  } catch {
    return [];
  }
}

function saveAll(tasks: FollowupTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function listFollowupTasks(): FollowupTask[] {
  return loadAll().sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export function addFollowupTask(task: FollowupTask) {
  saveAll([task, ...loadAll()]);
}

export function updateFollowupTask(id: string, patch: Partial<FollowupTask>) {
  saveAll(loadAll().map((t) => (t.id === id ? { ...t, ...patch } : t)));
}
