import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { companySettingsSchema } from "@/lib/validations/auth";

function serialize(user: {
  companyName: string | null;
  shortName: string | null;
  name: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  authorizedPhone: string | null;
  logoUrl: string | null;
  reportLogoUrl: string | null;
  letterheadImage: string | null;
  letterheadMode: string | null;
  contractLetterheadImage: string | null;
  offerLetterheadImage: string | null;
  tahsilatLetterheadImage: string | null;
  offerTemplateDocxName: string | null;
  permitDate: string | null;
  permitNumber: string | null;
  activityField: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  iban: string | null;
  currency: string | null;
  updatedAt: Date;
}) {
  return {
    companyName: user.companyName ?? "",
    shortName: user.shortName ?? "",
    authorizedName: user.name ?? "",
    address: user.address ?? "",
    country: user.country ?? "",
    city: user.city ?? "",
    district: user.district ?? "",
    phone: user.phone ?? "",
    authorizedPhone: user.authorizedPhone ?? "",
    logo: user.logoUrl,
    reportLogo: user.reportLogoUrl,
    letterheadImage: user.letterheadImage,
    letterheadMode: user.letterheadMode === "background" ? "background" : "header",
    contractLetterheadImage: user.contractLetterheadImage,
    offerLetterheadImage: user.offerLetterheadImage,
    tahsilatLetterheadImage: user.tahsilatLetterheadImage,
    // Ham .docx baytları (offerTemplateDocx) bilerek burada dönmüyor — ağır, sadece
    // /api/account/company-settings/offer-template-docx üzerinden istek anında okunuyor.
    offerTemplateDocxName: user.offerTemplateDocxName,
    permitDate: user.permitDate ?? "",
    permitNumber: user.permitNumber ?? "",
    activityField: user.activityField ?? "",
    taxNumber: user.taxNumber ?? "",
    taxOffice: user.taxOffice ?? "",
    iban: user.iban ?? "",
    currency: user.currency ?? "TRY",
    updatedAt: user.updatedAt,
  };
}

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!user) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(serialize(user));
}

export async function PATCH(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const body = await request.json();
  const parsed = companySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const values = parsed.data;
  let user;
  try {
    user = await prisma.user.update({
      where: { id: ownerId },
      data: {
        companyName: values.companyName,
        shortName: values.shortName || null,
        name: values.authorizedName || null,
        address: values.address || null,
        country: values.country || null,
        city: values.city || null,
        district: values.district || null,
        phone: values.phone || null,
        authorizedPhone: values.authorizedPhone || null,
        logoUrl: values.logo ?? null,
        reportLogoUrl: values.reportLogo ?? null,
        letterheadImage: values.letterheadImage ?? null,
        letterheadMode: values.letterheadMode ?? "header",
        contractLetterheadImage: values.contractLetterheadImage ?? null,
        offerLetterheadImage: values.offerLetterheadImage ?? null,
        tahsilatLetterheadImage: values.tahsilatLetterheadImage ?? null,
        // "Değişmediyse dokunma" — istemci bu turda .docx şablonunu yükleyip/kaldırmadıysa
        // alan hiç gönderilmez (undefined kalır), burada da mevcut kayda dokunulmaz. Aksi
        // halde sadece başka bir alanı güncelleyip Kaydet'e basmak önceden yüklenmiş
        // şablonu sessizce silerdi.
        ...(values.offerTemplateDocx !== undefined
          ? { offerTemplateDocx: values.offerTemplateDocx, offerTemplateDocxName: values.offerTemplateDocxName ?? null }
          : {}),
        permitDate: values.permitDate || null,
        permitNumber: values.permitNumber || null,
        activityField: values.activityField || null,
        taxNumber: values.taxNumber || null,
        taxOffice: values.taxOffice || null,
        iban: values.iban || null,
        currency: values.currency || "TRY",
      },
    });
  } catch (err) {
    // Büyük şablon görüntüleri (base64) bazı ortamlarda istek/gövde sınırına takılabiliyor —
    // burada asıl hatayı yutmadan, tarayıcıda okunabilir bir mesaja çeviriyoruz.
    return NextResponse.json(
      { message: err instanceof Error ? `Kaydedilemedi: ${err.message}` : "Kaydedilemedi." },
      { status: 500 },
    );
  }

  return NextResponse.json(serialize(user));
}
