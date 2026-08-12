// Şirket ayarları — giriş yapan müşteri firmasının kendi markalaşma bilgileri
// (logo, firma adı, yetkili adı soyadı). Bu ortamda gerçek bir backend/dosya
// depolama olmadığı için logo base64 olarak tarayıcının localStorage'ında
// tutulur; küçük logo görselleri için yeterlidir.
//
// Kaydedilen bilgiler:
//  - Dashboard karşılama kartında logo olarak gösterilir.
//  - Firma adına ait tüm PDF belgelerinde (cari ekstre, teklif, iş emri raporu)
//    hem logo hem de imza bölümünde "Yetkili Adı Soyadı" olarak basılır.

import { readImageFile } from "@/lib/file-utils";

const STORAGE_KEY = "pestshield.company.settings";

export type LetterheadMode = "header" | "background";

export interface CompanySettings {
  companyName: string;
  shortName: string;
  authorizedName: string;
  address: string;
  country: string;
  city: string;
  district: string;
  phone: string;
  authorizedPhone: string;
  logo: string | null;
  /// Programın ürettiği raporların (DÖF, Risk, Trend vb.) üst kısmında büyük gösterilecek
  /// ayrı bir logo — boşsa `logo`ya (küçük) düşülür.
  reportLogo: string | null;
  letterheadImage: string | null;
  letterheadMode: LetterheadMode;
  permitDate: string;
  permitNumber: string;
  activityField: string;
  taxNumber: string;
  taxOffice: string;
  iban: string;
  currency: string;
  updatedAt: string | null;
}

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "",
  shortName: "",
  authorizedName: "",
  address: "",
  country: "Türkiye",
  city: "",
  district: "",
  phone: "",
  authorizedPhone: "",
  logo: null,
  reportLogo: null,
  letterheadImage: null,
  letterheadMode: "header",
  permitDate: "",
  permitNumber: "",
  activityField: "",
  taxNumber: "",
  taxOffice: "",
  iban: "",
  currency: "TRY",
  updatedAt: null,
};

export function getCompanySettings(): CompanySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveCompanySettings(settings: CompanySettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetCompanySettings() {
  saveCompanySettings(DEFAULT_SETTINGS);
}

/** Seçilen logo dosyasını base64 data URL'e çevirir (5MB üstü reddedilir). */
export function readLogoFile(file: File): Promise<string> {
  return readImageFile(file, 5);
}

/** Seçilen antetli kağıt görselini base64 data URL'e çevirir (8MB üstü reddedilir — tam sayfa görseller daha büyük olabilir). */
export function readLetterheadFile(file: File): Promise<string> {
  return readImageFile(file, 8);
}

/** Seçilen rapor logosunu base64 data URL'e çevirir (5MB üstü reddedilir). */
export function readReportLogoFile(file: File): Promise<string> {
  return readImageFile(file, 5);
}
