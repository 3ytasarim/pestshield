// PestShield Envanter/Stok mock veri katmanı. Gerçek backend henüz bağlanmadı;
// tüm veriler deterministik olarak üretilir (Math.random KULLANILMAZ -
// aksi halde server/client hydration mismatch oluşur).

export type ProductCategory = "ilac" | "malzeme" | "ekipman";
export type ProductType = "biosidal" | "diger";
export type ProductUnit = "adet" | "litre" | "ml" | "kg" | "gr";

export type WarehouseType = "main" | "vehicle" | "branch";

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  address: string;
  manager: string;
  phone: string;
  capacityNote: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  type: ProductType;
  manufacturer: string;
  unit: ProductUnit;
  currentStock: number;
  criticalLevel: number;
  createdAt: string;
  warehouseId: string;
  /** Biyosidal ürünler için ruhsat/uyumluluk bilgileri (isBiosidal=true olduğunda anlamlıdır). */
  licenseNumber?: string;
  activeIngredient?: string;
  defaultDose?: string;
  targetOrganisms?: string;
  packageAmount?: string;
  antidote?: string;
  usageAreas?: string[];
  licenseFileDataUrl?: string;
  licenseFileName?: string;
  msdsFileDataUrl?: string;
  msdsFileName?: string;
}

export type StockTransactionType = "add" | "use";

export interface StockTransaction {
  id: string;
  productId: string;
  type: StockTransactionType;
  quantity: number;
  description: string;
  performedBy: string;
  date: string;
}

export const warehouses: Warehouse[] = [
  {
    id: "wh-001",
    name: "Ana Depo — Merkez",
    type: "main",
    address: "Tuzla OSB, İstanbul",
    manager: "Elif Demir",
    phone: "0532 400 10 10",
    capacityNote: "120 m²",
  },
  {
    id: "wh-002",
    name: "Araç Stoğu — Ahmet Yılmaz",
    type: "vehicle",
    address: "Saha ekibi — mobil",
    manager: "Ahmet Yılmaz",
    phone: "0532 100 10 20",
    capacityNote: "Araç bagajı",
  },
  {
    id: "wh-003",
    name: "Araç Stoğu — Mehmet Kaya",
    type: "vehicle",
    address: "Saha ekibi — mobil",
    manager: "Mehmet Kaya",
    phone: "0532 200 20 30",
    capacityNote: "Araç bagajı",
  },
  {
    id: "wh-004",
    name: "Şube Deposu — İzmir",
    type: "branch",
    address: "Bornova, İzmir",
    manager: "Aylin Yılmaz",
    phone: "0532 500 30 40",
    capacityNote: "35 m²",
  },
  {
    id: "wh-005",
    name: "Araç Stoğu — Elif Demir",
    type: "vehicle",
    address: "Saha ekibi — mobil",
    manager: "Elif Demir",
    phone: "0532 300 40 50",
    capacityNote: "Araç bagajı",
  },
];

export const products: Product[] = [
  {
    id: "prod-001",
    name: "Bandit Lt Larva",
    category: "ilac",
    type: "biosidal",
    manufacturer: "Sumitomo",
    unit: "kg",
    currentStock: 0,
    criticalLevel: 2,
    createdAt: "2026-01-12",
    warehouseId: "wh-001",
    licenseNumber: "2009/12-789",
    activeIngredient: "Deltamethrin %25",
    defaultDose: "25 g / 5 lt su",
    targetOrganisms: "Hamamböceği, karasinek",
  },
  {
    id: "prod-002",
    name: "Demand CS 100",
    category: "ilac",
    type: "biosidal",
    manufacturer: "Syngenta",
    unit: "litre",
    currentStock: 0,
    criticalLevel: 1,
    createdAt: "2026-01-12",
    warehouseId: "wh-001",
    licenseNumber: "2011/07-341",
    activeIngredient: "Lambda-cyhalothrin %10",
    defaultDose: "10 ml / 5 lt su",
    targetOrganisms: "Karınca, örümcek, hamamböceği",
  },
  {
    id: "prod-003",
    name: "Goliath Gel",
    category: "ilac",
    type: "biosidal",
    manufacturer: "BASF",
    unit: "adet",
    currentStock: 1,
    criticalLevel: 5,
    createdAt: "2026-01-15",
    warehouseId: "wh-002",
    licenseNumber: "2013/03-118",
    activeIngredient: "Fipronil %0.05",
    defaultDose: "0.5 g / m² (nokta uygulama)",
    targetOrganisms: "Hamamböceği",
  },
  {
    id: "prod-004",
    name: "Bromakil Pasta",
    category: "ilac",
    type: "biosidal",
    manufacturer: "Zapi",
    unit: "kg",
    currentStock: 0.5,
    criticalLevel: 3,
    createdAt: "2026-01-15",
    warehouseId: "wh-001",
    licenseNumber: "2015/09-502",
    activeIngredient: "Bromadiolon %0.005",
    defaultDose: "20-50 g / istasyon",
    targetOrganisms: "Fare, sıçan",
  },
  {
    id: "prod-005",
    name: "K-Othrine SC 25",
    category: "ilac",
    type: "biosidal",
    manufacturer: "Bayer",
    unit: "litre",
    currentStock: 8,
    criticalLevel: 2,
    createdAt: "2026-02-01",
    warehouseId: "wh-001",
    licenseNumber: "2010/05-276",
    activeIngredient: "Deltamethrin %2.5",
    defaultDose: "50 ml / 5 lt su",
    targetOrganisms: "Uçan ve sürünen haşereler",
  },
  {
    id: "prod-006",
    name: "Ficam D Toz",
    category: "ilac",
    type: "biosidal",
    manufacturer: "BASF",
    unit: "kg",
    currentStock: 12,
    criticalLevel: 3,
    createdAt: "2026-02-03",
    warehouseId: "wh-004",
    licenseNumber: "2008/11-093",
    activeIngredient: "Bendiocarb %1.5",
    defaultDose: "20-40 g / m²",
    targetOrganisms: "Karınca, pire, hamamböceği",
  },
  {
    id: "prod-007",
    name: "Yapışkan Tuzak Kartı",
    category: "malzeme",
    type: "diger",
    manufacturer: "PestShield",
    unit: "adet",
    currentStock: 240,
    criticalLevel: 50,
    createdAt: "2026-02-10",
    warehouseId: "wh-002",
  },
  {
    id: "prod-008",
    name: "Eldiven (Kimyasal Dayanımlı)",
    category: "malzeme",
    type: "diger",
    manufacturer: "Ansell",
    unit: "adet",
    currentStock: 36,
    criticalLevel: 20,
    createdAt: "2026-02-10",
    warehouseId: "wh-003",
  },
  {
    id: "prod-009",
    name: "Yem İstasyonu Anahtarı",
    category: "malzeme",
    type: "diger",
    manufacturer: "PestShield",
    unit: "adet",
    currentStock: 15,
    criticalLevel: 5,
    createdAt: "2026-02-14",
    warehouseId: "wh-002",
  },
  {
    id: "prod-010",
    name: "Sırt Pülverizatörü",
    category: "ekipman",
    type: "diger",
    manufacturer: "Solo",
    unit: "adet",
    currentStock: 6,
    criticalLevel: 2,
    createdAt: "2026-01-20",
    warehouseId: "wh-001",
  },
  {
    id: "prod-011",
    name: "UV Böcek Tuzağı",
    category: "ekipman",
    type: "diger",
    manufacturer: "Insect-O-Cutor",
    unit: "adet",
    currentStock: 9,
    criticalLevel: 3,
    createdAt: "2026-01-22",
    warehouseId: "wh-004",
  },
  {
    id: "prod-012",
    name: "Termal Kamera",
    category: "ekipman",
    type: "diger",
    manufacturer: "FLIR",
    unit: "adet",
    currentStock: 2,
    criticalLevel: 1,
    createdAt: "2026-01-25",
    warehouseId: "wh-001",
  },
  {
    id: "prod-013",
    name: "Kemirgen Yem İstasyonu Kutusu",
    category: "ekipman",
    type: "diger",
    manufacturer: "PestShield",
    unit: "adet",
    currentStock: 45,
    criticalLevel: 15,
    createdAt: "2026-01-28",
    warehouseId: "wh-001",
  },
];

export const stockTransactions: StockTransaction[] = [
  {
    id: "txn-001",
    productId: "prod-005",
    type: "add",
    quantity: 5,
    description: "Bayer sipariş no #4521",
    performedBy: "Ahmet Yılmaz",
    date: "2026-06-28",
  },
  {
    id: "txn-002",
    productId: "prod-001",
    type: "use",
    quantity: 2,
    description: "Liman Depo — larva kontrolü",
    performedBy: "Mehmet Kaya",
    date: "2026-06-30",
  },
  {
    id: "txn-003",
    productId: "prod-007",
    type: "use",
    quantity: 30,
    description: "Rutin istasyon değişimi",
    performedBy: "Elif Demir",
    date: "2026-07-02",
  },
  {
    id: "txn-004",
    productId: "prod-002",
    type: "use",
    quantity: 1,
    description: "Acil haşere müdahalesi",
    performedBy: "Ahmet Yılmaz",
    date: "2026-07-04",
  },
  {
    id: "txn-005",
    productId: "prod-006",
    type: "add",
    quantity: 10,
    description: "BASF sipariş no #4560",
    performedBy: "Mehmet Kaya",
    date: "2026-07-05",
  },
];

export function getCriticalProducts(list: Product[] = products): Product[] {
  return list.filter((p) => p.currentStock <= p.criticalLevel);
}

export function getTransactionsForProduct(productId: string): StockTransaction[] {
  return stockTransactions.filter((t) => t.productId === productId);
}

export function stockLevelRatio(product: Product): number {
  if (product.criticalLevel <= 0) return 1;
  const ratio = product.currentStock / (product.criticalLevel * 2);
  return Math.max(0, Math.min(1, ratio));
}

export function getProductsForWarehouse(warehouseId: string, list: Product[] = products): Product[] {
  return list.filter((p) => p.warehouseId === warehouseId);
}

/** Kritik ürünler için, eşiğin ne kadar altında kaldığını 0 (tam kritik sınırda) - 1 (stok yok) arasında ölçer. */
export function criticalSeverity(product: Product): number {
  if (product.criticalLevel <= 0) return product.currentStock <= 0 ? 1 : 0;
  return Math.max(0, Math.min(1, 1 - product.currentStock / product.criticalLevel));
}
