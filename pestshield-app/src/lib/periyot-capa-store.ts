// Periyot ziyaretine bağlı "Düzeltici Önleyici Faaliyet" notu — Denetim
// modülündeki genel CAPA sisteminden ayrı, doğrudan bir periyot ziyaretine
// (PeriyotOccurrence) bağlı hafif bir kayıt. Gerçek veri /api/crm/periyot/occurrences/[id]/capa-notes
// üzerinden Prisma'dan okunur/yazılır (bkz. PeriyotCapaNote modeli).

export interface PeriyotCapaNote {
  id: string;
  periyotOccurrenceId: string;
  description: string;
  documentName: string;
  documentDataUrl: string | null;
  documentFileName: string | null;
  createdAt: string;
}
