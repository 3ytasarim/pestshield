import type {
  AddressType,
  FileCategory,
  LocationType,
  PhotoCategory,
  TransactionType,
} from "@/lib/mock/crm";

export const SECTOR_OPTIONS = [
  "Gıda Üretimi",
  "Lojistik",
  "Otelcilik",
  "Restoran",
  "Fabrika",
  "Depo",
  "Sağlık",
  "Eğitim",
];

export const CUSTOMER_TYPE_OPTIONS = ["Bireysel", "Kurumsal"];
export const SERVICE_TYPE_OPTIONS = [
  "Genel Haşere Kontrolü",
  "Kemirgen Kontrolü",
  "Uçan Haşere Kontrolü",
  "Entegre Haşere Yönetimi",
];
export const SERVICE_PERIOD_OPTIONS = ["Haftalık", "2 Haftada Bir", "Aylık", "3 Aylık"];
export const OPERATIONS_MANAGER_OPTIONS = ["Mehmet Kaya", "Ahmet Yılmaz", "Elif Demir"];
export const SALES_REP_OPTIONS = ["Aylin Aydın", "Burak Arslan"];
export const CURRENCY_OPTIONS = ["TRY", "USD", "EUR"];
export const CITY_OPTIONS = ["İstanbul", "Ankara", "İzmir", "Bursa", "Kocaeli", "Antalya", "Tekirdağ"];

export const VAT_RATE_OPTIONS = [1, 8, 10, 20];

export const WITHHOLDING_TAX_OPTIONS = [
  { value: "none", label: "Tevkifat Yok" },
  { value: "9/10", label: "9/10 Uygula" },
  { value: "7/10", label: "7/10 Uygula" },
  { value: "5/10", label: "5/10 Uygula" },
  { value: "3/10", label: "3/10 Uygula" },
  { value: "2/10", label: "2/10 Uygula" },
];

/** Tevkifat oranından KDV üzerinden kesilecek payı hesaplar (ör. "7/10" -> 0.7). */
export function withholdingFraction(value: string): number {
  if (value === "none") return 0;
  const [num, den] = value.split("/").map(Number);
  return den ? num / den : 0;
}

export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  billing: "Fatura Adresi",
  service: "Servis Adresi",
  shipping: "Sevkiyat Adresi",
  branch: "Şube Adresi",
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  production_area: "Üretim Alanı",
  warehouse: "Depo",
  cafeteria: "Yemekhane",
  office: "Ofis",
  garden: "Bahçe",
  waste_area: "Çöp Alanı",
  loading_area: "Yükleme Alanı",
  raw_material_warehouse: "Hammadde Deposu",
  finished_goods_warehouse: "Mamul Depo",
};

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  contract: "Sözleşme",
  service_report: "Servis Raporu",
  certificate: "Sertifika",
  msds: "MSDS",
  license: "Ruhsat",
  audit_document: "Denetim Belgesi",
  invoice: "Fatura",
  offer: "Teklif",
  other: "Diğer",
};

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  before: "Öncesi",
  after: "Sonrası",
  station: "İstasyon",
  risk: "Risk",
  hygiene: "Hijyen",
  structural_gap: "Yapısal Açıklık",
  corrective_action: "Düzeltici Faaliyet",
  general: "Genel",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  invoice: "Fatura",
  collection: "Tahsilat",
  refund: "İade",
  discount: "İskonto",
  manual: "Manuel İşlem",
};
