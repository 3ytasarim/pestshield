// Hizmet kaydına ait "Belge Tanımlama" ile yüklenen belgeler (JPEG/JPG/PNG/PDF) —
// gerçek bir dosya depolama olmadığı için base64 data URL olarak localStorage'da
// tutulur, tıpkı logo/mühür yüklemelerinde olduğu gibi.

import type { ServiceDocument } from "@/lib/mock/crm";

const STORAGE_KEY = "pestshield.crm.serviceDocuments";

export function loadServiceDocuments(): ServiceDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ServiceDocument[];
  } catch {
    return [];
  }
}

export function saveServiceDocuments(documents: ServiceDocument[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function getServiceDocumentsFor(serviceOrderId: string): ServiceDocument[] {
  return loadServiceDocuments().filter((d) => d.serviceOrderId === serviceOrderId);
}

export function addServiceDocument(document: ServiceDocument) {
  saveServiceDocuments([document, ...loadServiceDocuments()]);
}

export function deleteServiceDocument(id: string) {
  saveServiceDocuments(loadServiceDocuments().filter((d) => d.id !== id));
}

export { readImageFile as readDocumentFile } from "@/lib/file-utils";
