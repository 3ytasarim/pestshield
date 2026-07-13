// Periyot ziyaretine bağlı "Düzeltici Önleyici Faaliyet" notları — Denetim
// modülündeki genel CAPA sisteminden ayrı, doğrudan bir periyot ziyaretine
// (PeriyotOccurrence) bağlı hafif kayıtlardır.

export interface PeriyotCapaNote {
  id: string;
  periyotOccurrenceId: string;
  description: string;
  documentName: string;
  documentDataUrl: string | null;
  documentFileName: string | null;
  createdAt: string;
}

const STORAGE_KEY = "pestshield.crm.periyotCapaNotes";

function loadNotes(): PeriyotCapaNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PeriyotCapaNote[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: PeriyotCapaNote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getPeriyotCapaNotesFor(periyotOccurrenceId: string): PeriyotCapaNote[] {
  return loadNotes().filter((n) => n.periyotOccurrenceId === periyotOccurrenceId);
}

export function addPeriyotCapaNote(note: PeriyotCapaNote) {
  saveNotes([note, ...loadNotes()]);
}

export function deletePeriyotCapaNote(id: string) {
  saveNotes(loadNotes().filter((n) => n.id !== id));
}
