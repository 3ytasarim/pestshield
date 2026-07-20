import type { ProductCategory, ProductType, ProductUnit, WarehouseType } from "@/lib/mock/inventory";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ilac: "İlaç",
  malzeme: "Malzeme",
  ekipman: "Ekipman",
};

export const TYPE_LABELS: Record<ProductType, string> = {
  biosidal: "Biyosidal",
  diger: "Diğer",
};

export const UNIT_LABELS: Record<ProductUnit, string> = {
  adet: "Adet",
  litre: "Litre",
  ml: "ml",
  kg: "kg",
  gr: "gr",
};

export const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "ilac", label: "İlaç" },
  { value: "malzeme", label: "Malzeme" },
  { value: "ekipman", label: "Ekipman" },
];

export const UNIT_OPTIONS: { value: ProductUnit; label: string }[] = [
  { value: "adet", label: "adet" },
  { value: "litre", label: "litre" },
  { value: "ml", label: "ml" },
  { value: "kg", label: "kg" },
  { value: "gr", label: "gr" },
];

export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  main: "Ana Depo",
  vehicle: "Araç Stoğu",
  branch: "Şube Deposu",
};

/** Biyosidal ürün için kullanım yeri / hedef alan seçenekleri (çoklu seçim). */
export const USAGE_AREA_OPTIONS: string[] = [
  "Kemirgen",
  "Yürüyen",
  "Uçkun",
  "Larvasit",
  "Dezenfeksiyon",
  "Depo Ürün Böcekleri",
  "Tekstil Zararlıları",
  "Haşeresiz Koşullar",
  "İstila",
  "Kuş",
  "Pire",
  "Sıçan",
  "Fare",
  "Haşere Koruma",
  "Hamam Böceği",
  "Karınca",
];
