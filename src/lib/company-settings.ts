// Şirket ayarları — giriş yapan müşteri firmasının kendi markalaşma bilgileri
// (logo, firma adı, yetkili adı soyadı). Bu ortamda gerçek bir backend/dosya
// depolama olmadığı için logo base64 olarak tarayıcının localStorage'ında
// tutulur; küçük logo görselleri için yeterlidir.
//
// Kaydedilen bilgiler:
//  - Dashboard karşılama kartında logo olarak gösterilir.
//  - Firma adına ait tüm PDF belgelerinde (cari ekstre, teklif, iş emri raporu)
//    hem logo hem de imza bölümünde "Yetkili Adı Soyadı" olarak basılır.

const STORAGE_KEY = "pestshield.company.settings";

export interface CompanySettings {
  companyName: string;
  authorizedName: string;
  address: string;
  phone: string;
  logo: string | null;
  updatedAt: string | null;
}

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "",
  authorizedName: "",
  address: "",
  phone: "",
  logo: null,
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
export { readImageFile as readLogoFile } from "@/lib/file-utils";
