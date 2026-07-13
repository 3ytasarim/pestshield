// Hizmet kaydına ait "Kroki Tanımlama" ile yüklenen saha krokileri (JPG/PNG) ve
// üzerine yerleştirilen istasyon işaretleri — gerçek bir dosya depolama olmadığı
// için görsel base64 data URL olarak, işaretler ise x/y yüzde koordinatı olarak
// localStorage'da tutulur.

import type { KrokiSketch, KrokiStationType } from "@/lib/mock/crm";

const STORAGE_KEY = "pestshield.crm.krokiSketches";

export const DEFAULT_LAYER_VISIBILITY: Record<KrokiStationType, boolean> = {
  zehirli: true,
  zehirsiz: true,
  ic_uckun: true,
  dis_uckun: true,
};

export function loadKrokiSketches(): KrokiSketch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KrokiSketch[];
  } catch {
    return [];
  }
}

export function saveKrokiSketches(sketches: KrokiSketch[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sketches));
}

export function getKrokiSketchesFor(serviceOrderId: string): KrokiSketch[] {
  return loadKrokiSketches().filter((s) => s.serviceOrderId === serviceOrderId);
}

export function addKrokiSketch(sketch: KrokiSketch) {
  saveKrokiSketches([sketch, ...loadKrokiSketches()]);
}

export function updateKrokiSketch(id: string, patch: Partial<KrokiSketch>) {
  saveKrokiSketches(loadKrokiSketches().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function deleteKrokiSketch(id: string) {
  saveKrokiSketches(loadKrokiSketches().filter((s) => s.id !== id));
}

export { readImageFile as readKrokiFile } from "@/lib/file-utils";
