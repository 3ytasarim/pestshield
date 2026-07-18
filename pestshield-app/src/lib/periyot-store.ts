// Hizmet kaydına ait "Periyot" (tekrarlayan uygulama takvimi) verileri —
// bir "Periyot Grubu" (PeriyotBatch, örn. "TARHANA PCO (301 Periyot her 1
// Günde bir)") belirli bir tarih aralığında + sıklıkta otomatik üretilen
// tekil uygulama kayıtlarını (PeriyotOccurrence) barındırır.

import type { PeriyotBatch, PeriyotDonem, PeriyotOccurrence } from "@/lib/mock/crm";

const BATCH_KEY = "pestshield.crm.periyotBatches";
const OCCURRENCE_KEY = "pestshield.crm.periyotOccurrences";

export const DONEM_LABELS: Record<PeriyotDonem, string> = {
  daily: "Günde bir",
  weekly: "Haftada bir",
  monthly: "Ayda bir",
};

function loadBatches(): PeriyotBatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BATCH_KEY);
    return raw ? (JSON.parse(raw) as PeriyotBatch[]) : [];
  } catch {
    return [];
  }
}

function saveBatches(batches: PeriyotBatch[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BATCH_KEY, JSON.stringify(batches));
}

function loadOccurrences(): PeriyotOccurrence[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OCCURRENCE_KEY);
    return raw ? (JSON.parse(raw) as PeriyotOccurrence[]) : [];
  } catch {
    return [];
  }
}

function saveOccurrences(occurrences: PeriyotOccurrence[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OCCURRENCE_KEY, JSON.stringify(occurrences));
}

export function getBatchesFor(serviceOrderId: string): PeriyotBatch[] {
  return loadBatches().filter((b) => b.serviceOrderId === serviceOrderId);
}

export function getOccurrencesFor(batchId: string): PeriyotOccurrence[] {
  return loadOccurrences()
    .filter((o) => o.batchId === batchId)
    .sort((a, b) => (a.periodDate < b.periodDate ? -1 : 1));
}

export function getOccurrenceById(id: string): PeriyotOccurrence | null {
  return loadOccurrences().find((o) => o.id === id) ?? null;
}

/** Tüm servis siparişleri/gruplar arasında ham erişim — teknisyen çakışma taraması gibi çapraz sorgular için. */
export function getAllOccurrences(): PeriyotOccurrence[] {
  return loadOccurrences();
}

const AI_BATCH_NAME = "AI ile Oluşturulan Servisler";

/** AI Command Center'ın tekil (tekrarlamayan) servis önerileri için kullandığı sabit grup — var olan bir grubu bulur ya da ilk seferinde oluşturur. */
export function ensureAiBatch(serviceOrderId: string): PeriyotBatch {
  const existing = getBatchesFor(serviceOrderId).find((b) => b.name === AI_BATCH_NAME);
  if (existing) return existing;
  const batch: PeriyotBatch = { id: `periyot-batch-ai-${Date.now()}`, serviceOrderId, name: AI_BATCH_NAME, donem: "daily", createdAt: new Date().toISOString() };
  saveBatches([...loadBatches(), batch]);
  return batch;
}

export function getBatchById(id: string): PeriyotBatch | null {
  return loadBatches().find((b) => b.id === id) ?? null;
}

export function addOccurrence(occurrence: PeriyotOccurrence) {
  saveOccurrences([...loadOccurrences(), occurrence]);
}

export function updateOccurrence(id: string, patch: Partial<PeriyotOccurrence>) {
  saveOccurrences(loadOccurrences().map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

export function deleteOccurrence(id: string) {
  saveOccurrences(loadOccurrences().filter((o) => o.id !== id));
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface GenerateOptions {
  serviceOrderId: string;
  namePrefix: string;
  personnelName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  dayOfMonth: number;
  donem: PeriyotDonem;
}

/** Tarih aralığı + sıklığa göre bir Periyot Grubu ve tüm uygulama tarihlerini otomatik üretir. */
export function generateBatch(options: GenerateOptions): PeriyotBatch {
  const { serviceOrderId, namePrefix, personnelName, startDate, endDate, startTime, endTime, dayOfMonth, donem } = options;

  const dates: string[] = [];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (donem === "daily") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(toLocalIso(d));
    }
  } else if (donem === "weekly") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
      dates.push(toLocalIso(d));
    }
  } else {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const day = Math.min(dayOfMonth, daysInMonth);
      const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      if (occurrenceDate >= start && occurrenceDate <= end) {
        dates.push(toLocalIso(occurrenceDate));
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  const batch: PeriyotBatch = {
    id: `periyot-batch-${Date.now()}`,
    serviceOrderId,
    name: `${namePrefix} PCO (${dates.length} Periyot her 1 ${DONEM_LABELS[donem]})`,
    donem,
    createdAt: new Date().toISOString(),
  };
  saveBatches([...loadBatches(), batch]);

  const occurrences: PeriyotOccurrence[] = dates.map((date, i) => ({
    id: `periyot-occ-${Date.now()}-${i}`,
    batchId: batch.id,
    serviceOrderId,
    personnelName,
    periodDate: date,
    startTime,
    endTime,
    documentCount: 0,
    biocidalProducts: "",
    biocidalProductUsages: [],
    createdAt: new Date().toISOString(),
  }));
  saveOccurrences([...loadOccurrences(), ...occurrences]);

  return batch;
}

export function deleteBatch(batchId: string) {
  saveBatches(loadBatches().filter((b) => b.id !== batchId));
  saveOccurrences(loadOccurrences().filter((o) => o.batchId !== batchId));
}
