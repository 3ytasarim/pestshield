// Periyot ziyaretlerinde İstasyonlar formunda doldurulan denetim kayıtları —
// her kayıt bir periyot ziyareti (PeriyotOccurrence) + bir kroki istasyonu
// (KrokiStation) kombinasyonuna bağlıdır. Alan tanımları istasyon tipine göre
// sabittir (bkz. istasyon-inspection-constants.ts).

import type { StationInspection } from "@/lib/mock/crm";

const STORAGE_KEY = "pestshield.crm.stationInspections";

export function loadInspections(): StationInspection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StationInspection[]) : [];
  } catch {
    return [];
  }
}

export function saveInspections(inspections: StationInspection[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
}

export function getInspectionsFor(periyotOccurrenceId: string): StationInspection[] {
  return loadInspections().filter((i) => i.periyotOccurrenceId === periyotOccurrenceId);
}

/** Verilen periyot ziyareti için tüm kayıtları tek seferde kaydeder (var olanları günceller, yenilerini ekler). */
export function saveInspectionsFor(periyotOccurrenceId: string, inspections: StationInspection[]) {
  const others = loadInspections().filter((i) => i.periyotOccurrenceId !== periyotOccurrenceId);
  saveInspections([...others, ...inspections]);
}
