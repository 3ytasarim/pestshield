// EK-1 Biyosidal Ürün Uygulama İşlem Formu kayıtları — her periyot ziyaretine
// (PeriyotOccurrence) ait tek bir form kaydı tutulur.

import type { Ek1Form } from "@/lib/mock/crm";

const STORAGE_KEY = "pestshield.crm.ek1Forms";

function loadForms(): Ek1Form[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Ek1Form[]) : [];
  } catch {
    return [];
  }
}

function saveForms(forms: Ek1Form[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

export function getEk1FormFor(periyotOccurrenceId: string): Ek1Form | null {
  return loadForms().find((f) => f.periyotOccurrenceId === periyotOccurrenceId) ?? null;
}

export function saveEk1Form(form: Ek1Form) {
  const others = loadForms().filter((f) => f.periyotOccurrenceId !== form.periyotOccurrenceId);
  saveForms([...others, form]);
}
