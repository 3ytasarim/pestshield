import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";

/** Müşteri portalı — bu müşteriye ait Biyosidal Ürün Uygulama Raporları (EK-1 formları). */
export async function GET() {
  const { customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const forms = await prisma.ek1Form.findMany({
    where: { periyotOccurrence: { customerId } },
    include: {
      periyotOccurrence: { select: { periodDate: true, startTime: true, endTime: true, batch: { select: { name: true } } } },
      owner: { select: { companyName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    reports: forms.map((form) => ({
      id: form.id,
      updatedAt: form.updatedAt,
      companyName: form.owner.companyName,
      batchName: form.periyotOccurrence.batch.name,
      occurrence: {
        periodDate: form.periyotOccurrence.periodDate,
        startTime: form.periyotOccurrence.startTime,
        endTime: form.periyotOccurrence.endTime,
      },
      form: {
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
        guvenlikOnlemleri: form.guvenlikOnlemleri,
        ekipSorumlusuImza: form.ekipSorumlusuImza,
        ekipSorumlusuImzaData: form.ekipSorumlusuImzaData,
        yeriSorumlusuImza: form.yeriSorumlusuImza,
        yeriSorumlusuImzaData: form.yeriSorumlusuImzaData,
      },
    })),
  });
}
