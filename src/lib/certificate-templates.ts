// Ürün Uygulama Belgesi şablon ayarları — hangi tasarımın kullanılacağı ve
// (varsa) firmanın kendi hesabında kendi seçimiyle yüklediği mühür/damga
// görseli. Mühür alanı varsayılan olarak boştur; hiçbir görsel otomatik
// olarak eklenmez — yalnızca hesap sahibi kendi görselini kendisi yükler.

const STORAGE_KEY = "pestshield.certificate.template";

export type CertificateStyle = "gold-ribbon" | "green-frame";

export interface CertificateTemplateSettings {
  style: CertificateStyle;
  sealImage: string | null;
  updatedAt: string | null;
}

const DEFAULT_SETTINGS: CertificateTemplateSettings = {
  style: "gold-ribbon",
  sealImage: null,
  updatedAt: null,
};

export function getCertificateTemplate(): CertificateTemplateSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveCertificateTemplate(settings: CertificateTemplateSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export { readImageFile as readSealFile } from "@/lib/file-utils";
