// Periyot "Düzenle" ekranında girilen biyosidal ürün / malzeme / uygulama bilgilerini
// tekrar kullanmak için kaydedilen şablonlar — hangi periyot olursa olsun uygulanabilir.

import type { BiocidalProductUsage, MalzemeKullanimi } from "@/lib/mock/crm";

export interface PeriyotTemplate {
  id: string;
  name: string;
  biocidalProductUsages: BiocidalProductUsage[];
  urunUygulamaSekli: string;
  meskenIsyeriVb: string;
  uygulamaAlani: string;
  uygulamaAlaniBirimi: string;
  guvenlikOnlemleri: string;
  malzemeKullanimlari: MalzemeKullanimi[];
}

const STORAGE_KEY = "pestshield.crm.periyotTemplates";

export function loadTemplates(): PeriyotTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PeriyotTemplate[]) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: PeriyotTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function saveTemplate(template: PeriyotTemplate) {
  saveTemplates([...loadTemplates(), template]);
}

export function deleteTemplate(id: string) {
  saveTemplates(loadTemplates().filter((t) => t.id !== id));
}
