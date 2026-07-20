import type {
  PeriyotBatch as PrismaPeriyotBatch,
  PeriyotOccurrence as PrismaPeriyotOccurrence,
  PeriyotBiocidalProductUsage as PrismaBiocidalUsage,
  Ek1Form as PrismaEk1Form,
  PeriyotCapaNote as PrismaPeriyotCapaNote,
} from "@/generated/prisma";
import type {
  PeriyotBatch,
  PeriyotOccurrence,
  BiocidalProductUsage,
  PeriyotDonem,
  Ek1Form,
  MalzemeKullanimi,
} from "@/lib/mock/crm";
import type { PeriyotCapaNote } from "@/lib/periyot-capa-store";

export function serializePeriyotBatch(batch: PrismaPeriyotBatch): PeriyotBatch {
  return {
    id: batch.id,
    serviceOrderId: batch.serviceOrderId,
    name: batch.name,
    donem: batch.donem as PeriyotDonem,
    createdAt: batch.createdAt,
  };
}

export function serializeBiocidalUsage(usage: PrismaBiocidalUsage): BiocidalProductUsage {
  return {
    id: usage.id,
    productId: usage.productId ?? "",
    productName: usage.productName,
    amount: usage.amount,
    unit: usage.unit,
  };
}

export function serializePeriyotOccurrence(
  occurrence: PrismaPeriyotOccurrence & { biocidalProductUsages?: PrismaBiocidalUsage[] },
): PeriyotOccurrence {
  return {
    id: occurrence.id,
    batchId: occurrence.batchId,
    serviceOrderId: occurrence.serviceOrderId,
    personnelName: occurrence.personnelName,
    periodDate: occurrence.periodDate,
    startTime: occurrence.startTime,
    endTime: occurrence.endTime,
    documentCount: occurrence.documentCount,
    biocidalProducts: occurrence.biocidalProducts,
    biocidalProductUsages: (occurrence.biocidalProductUsages ?? []).map(serializeBiocidalUsage),
    createdAt: occurrence.createdAt,
  };
}

export function serializeEk1Form(form: PrismaEk1Form): Ek1Form {
  return {
    id: form.id,
    periyotOccurrenceId: form.periyotOccurrenceId,
    uygulayanFirmaAdi: form.uygulayanFirmaAdi,
    acikAdresi: form.acikAdresi,
    mesulMudur: form.mesulMudur,
    uygulayicilar: form.uygulayicilar,
    telefon: form.telefon,
    izinTarihSayisi: form.izinTarihSayisi,
    ekipSorumlusu: form.ekipSorumlusu,
    urunTicariAdi: form.urunTicariAdi,
    urunUygulamaSekli: form.urunUygulamaSekli,
    urunAktifMaddesi: form.urunAktifMaddesi,
    urunAntidotu: form.urunAntidotu,
    urunAmbalajMiktari: form.urunAmbalajMiktari,
    uygulamaYeriAdresi: form.uygulamaYeriAdresi,
    hedefZararliTuru: form.hedefZararliTuru,
    meskenIsyeriVb: form.meskenIsyeriVb,
    meskenDaireSayisi: form.meskenDaireSayisi,
    uygulamaAlani: form.uygulamaAlani,
    uygulamaAlaniBirimi: form.uygulamaAlaniBirimi,
    kullanilanMalzemeler: form.kullanilanMalzemeler,
    malzemeKullanimlari: (form.malzemeKullanimlari as unknown as MalzemeKullanimi[]) ?? [],
    malzemelerEtkin: form.malzemelerEtkin,
    guvenlikOnlemleri: form.guvenlikOnlemleri,
    ekipSorumlusuImza: form.ekipSorumlusuImza,
    ekipSorumlusuImzaData: form.ekipSorumlusuImzaData,
    yeriSorumlusuImza: form.yeriSorumlusuImza,
    yeriSorumlusuImzaData: form.yeriSorumlusuImzaData,
    updatedAt: form.updatedAt,
  };
}

export function serializePeriyotCapaNote(note: PrismaPeriyotCapaNote): PeriyotCapaNote {
  return {
    id: note.id,
    periyotOccurrenceId: note.periyotOccurrenceId,
    description: note.description,
    documentName: note.documentName,
    documentDataUrl: note.documentDataUrl,
    documentFileName: note.documentFileName,
    createdAt: note.createdAt,
  };
}
