// PestShield CRM mock veri katmanı. Gerçek backend henüz bağlanmadı;
// tüm veriler deterministik olarak üretilir (Math.random KULLANILMAZ -
// aksi halde server/client hydration mismatch oluşur).

export type CustomerStatus = "active" | "passive";
export type CustomerType = "Bireysel" | "Kurumsal";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ContractStatus = "active" | "expiring" | "expired" | "cancelled";
export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type WorkOrderStatus = "planned" | "in_progress" | "completed" | "delayed" | "cancelled";
export type NotePriority = "low" | "normal" | "high" | "critical";
export type FileCategory =
  | "contract"
  | "service_report"
  | "certificate"
  | "msds"
  | "license"
  | "audit_document"
  | "invoice"
  | "offer"
  | "other";
export type PhotoCategory =
  | "before"
  | "after"
  | "station"
  | "risk"
  | "hygiene"
  | "structural_gap"
  | "corrective_action"
  | "general";
export type TransactionType = "invoice" | "collection" | "refund" | "discount" | "manual";
export type AddressType = "billing" | "service" | "shipping" | "branch";
export type LocationType =
  | "production_area"
  | "warehouse"
  | "cafeteria"
  | "office"
  | "garden"
  | "waste_area"
  | "loading_area"
  | "raw_material_warehouse"
  | "finished_goods_warehouse";
export type ActivityType =
  | "service_completed"
  | "offer_sent"
  | "contract_uploaded"
  | "payment_received"
  | "note_added";

export interface Customer {
  id: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  sector: string;
  customerType: CustomerType;
  isPotential: boolean;
  status: CustomerStatus;
  shortName: string;
  logo: string | null;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  fax: string;
  country: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string;
  iban: string;
  portalEmail: string;
  portalPassword: string;
  sendServiceReportEmail: boolean;
  sendTrendAnalysisEmail: boolean;
  sendCorrectiveActionEmail: boolean;
  serviceType: string;
  servicePeriod: string;
  operationsManager: string;
  salesRep: string;
  riskLevel: RiskLevel;
  accountCode: string;
  paymentTermDays: number;
  invoiceEmail: string;
  currency: string;
  riskScore: number;
  auditReadinessScore: number;
  lastServiceDate: string;
  nextServiceDate: string;
  pendingCollection: number;
  contractEndDate: string | null;
  parasutContactId: string | null;
  createdAt: string;
}

export interface Branch {
  id: string;
  customerId: string;
  name: string;
  code: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  addressLine: string;
  serviceStatus: CustomerStatus;
  riskLevel: RiskLevel;
  lastServiceDate: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  title: string;
  department: string;
  phone: string;
  email: string;
  note: string;
  isPrimary: boolean;
}

export interface Address {
  id: string;
  customerId: string;
  type: AddressType;
  country: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Location {
  id: string;
  customerId: string;
  branchName: string;
  name: string;
  type: LocationType;
  description: string;
  riskLevel: RiskLevel;
  isIndoor: boolean;
  stationCount: number;
  lastCheckDate: string;
}

export interface FileItem {
  id: string;
  customerId: string;
  name: string;
  category: FileCategory;
  uploadedBy: string;
  uploadedAt: string;
  sizeKb: number;
}

export interface Photo {
  id: string;
  customerId: string;
  category: PhotoCategory;
  description: string;
  date: string;
  location: string;
  uploadedBy: string;
  colorFrom: string;
  colorTo: string;
}

export interface Note {
  id: string;
  customerId: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: NotePriority;
  tags: string[];
  reminderDate: string | null;
}

export interface Contract {
  id: string;
  customerId: string;
  contractNo: string;
  serviceType: string;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  currency: string;
  status: ContractStatus;
  remainingDays: number;
  fileName: string | null;
}

export interface OfferItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface Offer {
  id: string;
  customerId: string;
  offerNo: string;
  title: string;
  amount: number;
  currency: string;
  validUntil: string;
  status: OfferStatus;
  createdAt: string;
  items: OfferItem[];
}

export interface ServiceOrderItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  vatRate: number;
}

export interface ServiceDocument {
  id: string;
  serviceOrderId: string;
  name: string;
  fileDataUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

export type KrokiStationType = "zehirli" | "zehirsiz" | "ic_uckun" | "dis_uckun";

export interface KrokiStation {
  id: string;
  type: KrokiStationType;
  x: number;
  y: number;
  stationId: string;
}

export interface KrokiSketch {
  id: string;
  serviceOrderId: string;
  name: string;
  createdDate: string;
  imageDataUrl: string;
  fileSizeKb: number;
  stations: KrokiStation[];
  stationSize: number;
  heatMapEnabled: boolean;
  layerVisibility: Record<KrokiStationType, boolean>;
  createdAt: string;
}

export interface StationInspection {
  id: string;
  periyotOccurrenceId: string;
  krokiSketchId: string;
  krokiStationId: string;
  stationType: KrokiStationType;
  // Zehirli İstasyon
  tuketim?: string;
  // Zehirsiz İstasyon
  hareket?: string;
  tur1?: string;
  tur2?: string;
  // İç Alan / Dış Alan Uçkun İstasyon (ortak alanlar)
  degisim?: string;
  tur?: string;
  sayim?: string;
  olcum?: string;
  florasanDurumu?: string;
}

/** Periyot ziyaretinde kullanılan tekil biyosidal ürün kaydı — Envanter'deki
 * (inventory.ts) `Product` kataloğundan seçilir, miktar+birim serbest girilir. */
export interface BiocidalProductUsage {
  id: string;
  productId: string;
  productName: string;
  amount: string;
  unit: string;
}

/** EK-1 formunun "Kullanılan Malzemeler" alanına karşılık gelen sabit ekipman
 * tipi kullanım kaydı — tip listesi sabittir (bkz. ek1-constants.ts), sadece
 * adet ve kullanıldı/kullanılmadı değeri periyot ziyaretine göre değişir. */
export interface MalzemeKullanimi {
  key: string;
  adet: string;
  kullanildi: boolean;
}

/** EK-1 Biyosidal Ürün Uygulama İşlem Formu (Değişik: RG-19/4/2014-28977) — alan
 * başlıkları resmi form ile birebir sabittir, sadece değerler periyot ziyaretine göre değişir. */
export interface Ek1Form {
  id: string;
  periyotOccurrenceId: string;
  // Uygulamayı Yapana Ait Bilgiler
  uygulayanFirmaAdi: string;
  acikAdresi: string;
  mesulMudur: string;
  uygulayicilar: string;
  telefon: string;
  izinTarihSayisi: string;
  ekipSorumlusu: string;
  // Kullanılan Biyosidal Ürüne Ait Bilgiler
  urunTicariAdi: string;
  urunUygulamaSekli: string;
  urunAktifMaddesi: string;
  urunAntidotu: string;
  urunAmbalajMiktari: string;
  // Uygulama Yapılan Yer Hakkında Bilgiler
  uygulamaYeriAdresi: string;
  hedefZararliTuru: string;
  meskenIsyeriVb: string;
  meskenDaireSayisi: string;
  uygulamaAlani: string;
  uygulamaAlaniBirimi: string;
  kullanilanMalzemeler: string;
  malzemeKullanimlari: MalzemeKullanimi[];
  malzemelerEtkin: boolean;
  guvenlikOnlemleri: string;
  // İmza
  ekipSorumlusuImza: string;
  ekipSorumlusuImzaData: string | null;
  yeriSorumlusuImza: string;
  yeriSorumlusuImzaData: string | null;
  updatedAt: string;
}

export type PeriyotDonem = "daily" | "weekly" | "monthly";

export interface PeriyotBatch {
  id: string;
  serviceOrderId: string;
  name: string;
  donem: PeriyotDonem;
  createdAt: string;
}

export interface PeriyotOccurrence {
  id: string;
  batchId: string;
  serviceOrderId: string;
  personnelName: string;
  periodDate: string;
  startTime: string;
  endTime: string;
  documentCount: number;
  biocidalProducts: string;
  biocidalProductUsages: BiocidalProductUsage[];
  createdAt: string;
}

export interface ServiceOrder {
  id: string;
  customerId: string;
  serviceNo: string;
  description: string;
  contractStartDate: string;
  contractEndDate: string;
  assignedPersonnel: string;
  periodDays: number;
  withholdingTax: string;
  items: ServiceOrderItem[];
  subtotal: number;
  vatTotal: number;
  withholdingAmount: number;
  total: number;
  approved: boolean;
  approvedAt: string | null;
  documentCount: number;
  sketchCount: number;
  contractFileDataUrl: string | null;
  contractFileName: string | null;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  customerId: string;
  orderNo: string;
  serviceType: string;
  technician: string;
  plannedDate: string;
  completedDate: string | null;
  status: WorkOrderStatus;
  riskFinding: string | null;
  hasReport: boolean;
  productsUsed: string[];
  stationsChecked: number;
  technicianNote: string;
  customerSigned: boolean;
}

export interface AccountTransaction {
  id: string;
  customerId: string;
  date: string;
  type: TransactionType;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: "completed" | "pending";
}

export interface ActivityItem {
  id: string;
  customerId: string;
  type: ActivityType;
  message: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Sabit kaynak veri (deterministik üretim için)
// ---------------------------------------------------------------------------

const DISTRICTS: Record<string, string[]> = {
  İstanbul: ["Tuzla", "Ümraniye", "Kartal", "Başakşehir"],
  Ankara: ["Çankaya", "Sincan"],
  İzmir: ["Bornova", "Çiğli"],
  Bursa: ["Nilüfer", "Osmangazi"],
  Kocaeli: ["Gebze", "İzmit"],
  Antalya: ["Kepez", "Muratpaşa"],
  Tekirdağ: ["Çorlu", "Çerkezköy"],
};

const CUSTOMER_SEED: Array<{
  companyName: string;
  sector: string;
  city: string;
  status: CustomerStatus;
  riskLevel: RiskLevel;
}> = [
  { companyName: "Pakiş İlaçlama Hizmetleri", sector: "Sağlık", city: "İstanbul", status: "active", riskLevel: "low" },
  { companyName: "Marmara Gıda Üretim A.Ş.", sector: "Gıda Üretimi", city: "Kocaeli", status: "active", riskLevel: "high" },
  { companyName: "Tuzla Lojistik Merkezi", sector: "Lojistik", city: "İstanbul", status: "active", riskLevel: "medium" },
  { companyName: "Anadolu Unlu Mamuller", sector: "Gıda Üretimi", city: "Ankara", status: "passive", riskLevel: "critical" },
  { companyName: "Delta Depolama", sector: "Depo", city: "Bursa", status: "active", riskLevel: "medium" },
  { companyName: "Nova Otelcilik", sector: "Otelcilik", city: "Antalya", status: "active", riskLevel: "low" },
  { companyName: "Ege Ambalaj Sanayi", sector: "Fabrika", city: "İzmir", status: "passive", riskLevel: "high" },
];

const FIRST_NAMES = ["Ahmet", "Elif", "Mehmet", "Zeynep", "Can", "Aylin", "Burak", "Selin"];
const LAST_NAMES = ["Yılmaz", "Demir", "Kaya", "Şahin", "Çelik", "Aydın", "Arslan", "Doğan"];
const TITLES = ["Genel Müdür", "Operasyon Müdürü", "Kalite Sorumlusu", "Satın Alma Uzmanı", "Tesis Yöneticisi"];
const SERVICE_TYPES = ["Genel Haşere Kontrolü", "Kemirgen Kontrolü", "Uçan Haşere Kontrolü", "Entegre Haşere Yönetimi"];
const SERVICE_PERIODS = ["Haftalık", "2 Haftada Bir", "Aylık", "3 Aylık"];
const OPS_MANAGERS = ["Mehmet Kaya", "Ahmet Yılmaz", "Elif Demir"];
const SALES_REPS = ["Aylin Aydın", "Burak Arslan"];

function personName(index: number): string {
  return `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 3 + 1) % LAST_NAMES.length]}`;
}

function pad(n: number, len = 3): string {
  return String(n).padStart(len, "0");
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const customers: Customer[] = CUSTOMER_SEED.map((seed, i) => {
  const district = DISTRICTS[seed.city][i % DISTRICTS[seed.city].length];
  const riskScore = seed.riskLevel === "critical" ? 82 : seed.riskLevel === "high" ? 64 : seed.riskLevel === "medium" ? 38 : 14;
  const contractEndDays = [45, 18, 120, -10, 200, 300, -30][i];
  return {
    id: `cust-${pad(i + 1)}`,
    companyName: seed.companyName,
    taxNumber: `729${pad(i + 1, 6)}`,
    taxOffice: `${seed.city} Vergi Dairesi`,
    sector: seed.sector,
    customerType: "Kurumsal",
    isPotential: false,
    status: seed.status,
    shortName: seed.companyName.split(" ").slice(0, -1).join(" ") || seed.companyName,
    logo: null,
    contactName: personName(i),
    contactTitle: TITLES[i % TITLES.length],
    contactPhone: `0532 ${pad(100 + i, 3)} ${pad(10 + i, 2)} ${pad(20 + i, 2)}`,
    contactEmail: `iletisim${i + 1}@${seed.companyName.toLowerCase().split(" ")[0]}.com.tr`,
    fax: "",
    country: "Türkiye",
    city: seed.city,
    district,
    addressLine: `${district} Organize Sanayi Bölgesi, ${i + 1}. Cadde No: ${i + 12}`,
    postalCode: `${34000 + i * 110}`,
    iban: `TR${pad(33 + i, 2)}0006 1005 1978 6457 84${pad(i + 1, 2)}`,
    portalEmail: `iletisim${i + 1}@${seed.companyName.toLowerCase().split(" ")[0]}.com.tr`,
    portalPassword: "pestshield123",
    sendServiceReportEmail: true,
    sendTrendAnalysisEmail: true,
    sendCorrectiveActionEmail: true,
    serviceType: SERVICE_TYPES[i % SERVICE_TYPES.length],
    servicePeriod: SERVICE_PERIODS[i % SERVICE_PERIODS.length],
    operationsManager: OPS_MANAGERS[i % OPS_MANAGERS.length],
    salesRep: SALES_REPS[i % SALES_REPS.length],
    riskLevel: seed.riskLevel,
    accountCode: `CARI-${pad(i + 1)}`,
    paymentTermDays: [15, 30, 45, 30, 60, 30, 15][i],
    invoiceEmail: `fatura${i + 1}@${seed.companyName.toLowerCase().split(" ")[0]}.com.tr`,
    currency: "TRY",
    riskScore,
    auditReadinessScore: Math.max(20, 95 - riskScore),
    lastServiceDate: daysFromNow(-[3, 7, 14, 40, 5, 20, 55][i]),
    nextServiceDate: daysFromNow([10, 4, 18, -5, 12, 25, -8][i]),
    pendingCollection: [0, 18400, 4200, 62500, 0, 9800, 31200][i],
    contractEndDate: contractEndDays > 0 ? daysFromNow(contractEndDays) : contractEndDays === 0 ? null : daysFromNow(contractEndDays),
    parasutContactId: null,
    createdAt: daysFromNow(-[400, 220, 610, 900, 150, 730, 500][i]),
  };
});

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// Tüm müşteriler genelinde toplanmış (cross-customer) listeler.
// Standalone CRM sayfaları (Şubeler, Lokasyonlar, İletişim Kişileri, Teklifler,
// Sözleşmeler) bu fonksiyonları kullanır; müşteri detayındaki mevcut sekmeler
// aynı per-customer generator fonksiyonlarını (getBranches vb.) kullanmaya devam eder.
// ---------------------------------------------------------------------------

export function getAllBranches(): Branch[] {
  return customers.flatMap((c) => getBranches(c.id));
}

export function getAllLocations(): Location[] {
  return customers.flatMap((c) => getLocations(c.id));
}

export function getAllContacts(): Contact[] {
  return customers.flatMap((c) => getContacts(c.id));
}

export function getAllContracts(): Contract[] {
  return customers.flatMap((c) => getContracts(c.id));
}

export function getAllOffers(): Offer[] {
  return customers.flatMap((c) => getOffers(c.id));
}

export function getAllWorkOrders(): WorkOrder[] {
  return customers.flatMap((c) => getWorkOrders(c.id));
}

// ---------------------------------------------------------------------------
// Şubeler
// ---------------------------------------------------------------------------

export function getBranches(customerId: string): Branch[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  const count = 1 + (parseInt(customerId.slice(-2), 10) % 3);
  return Array.from({ length: count }, (_, i) => ({
    id: `${customerId}-branch-${i + 1}`,
    customerId,
    name: `${customer.city} Şube ${i + 1}`,
    code: `SB-${customer.accountCode.split("-")[1]}-${i + 1}`,
    contactName: personName(i + 2),
    phone: `0533 ${pad(200 + i, 3)} ${pad(30 + i, 2)} ${pad(40 + i, 2)}`,
    email: `sube${i + 1}@${customer.companyName.toLowerCase().split(" ")[0]}.com.tr`,
    city: customer.city,
    district: DISTRICTS[customer.city][(i + 1) % DISTRICTS[customer.city].length],
    addressLine: `${customer.district} Mahallesi, Sanayi Sokak No: ${i + 5}`,
    serviceStatus: i === 0 ? customer.status : "active",
    riskLevel: (["low", "medium", "high"] as RiskLevel[])[(i + customer.riskScore) % 3],
    lastServiceDate: daysFromNow(-(2 + i * 6)),
  }));
}

// ---------------------------------------------------------------------------
// İletişim Kişileri
// ---------------------------------------------------------------------------

export function getContacts(customerId: string): Contact[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  const departments = ["Yönetim", "Kalite", "Satın Alma", "Operasyon"];
  return [
    {
      id: `${customerId}-contact-1`,
      customerId,
      name: customer.contactName,
      title: customer.contactTitle,
      department: "Yönetim",
      phone: customer.contactPhone,
      email: customer.contactEmail,
      note: "Birincil karar verici",
      isPrimary: true,
    },
    ...Array.from({ length: 2 }, (_, i) => ({
      id: `${customerId}-contact-${i + 2}`,
      customerId,
      name: personName(i + 4),
      title: TITLES[(i + 2) % TITLES.length],
      department: departments[(i + 1) % departments.length],
      phone: `0534 ${pad(300 + i, 3)} ${pad(50 + i, 2)} ${pad(60 + i, 2)}`,
      email: `kisi${i + 2}@${customer.companyName.toLowerCase().split(" ")[0]}.com.tr`,
      note: "",
      isPrimary: false,
    })),
  ];
}

// ---------------------------------------------------------------------------
// Adresler
// ---------------------------------------------------------------------------

export function getAddresses(customerId: string): Address[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  const types: AddressType[] = ["billing", "service", "shipping"];
  return types.map((type, i) => ({
    id: `${customerId}-address-${i + 1}`,
    customerId,
    type,
    country: "Türkiye",
    city: customer.city,
    district: customer.district,
    neighborhood: `${customer.district} Mahallesi`,
    addressLine: customer.addressLine,
    postalCode: customer.postalCode,
    isDefault: i === 0,
  }));
}

// ---------------------------------------------------------------------------
// Lokasyonlar
// ---------------------------------------------------------------------------

const LOCATION_SEED: { name: string; type: LocationType }[] = [
  { name: "Üretim Alanı", type: "production_area" },
  { name: "Ana Depo", type: "warehouse" },
  { name: "Personel Yemekhanesi", type: "cafeteria" },
  { name: "Yönetim Ofisi", type: "office" },
  { name: "Çevre Bahçe Alanı", type: "garden" },
  { name: "Atık Toplama Alanı", type: "waste_area" },
  { name: "Yükleme Rampası", type: "loading_area" },
  { name: "Hammadde Deposu", type: "raw_material_warehouse" },
  { name: "Mamul Ürün Deposu", type: "finished_goods_warehouse" },
];

export function getLocations(customerId: string): Location[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  const count = 3 + (parseInt(customerId.slice(-2), 10) % 4);
  return Array.from({ length: count }, (_, i) => {
    const seed = LOCATION_SEED[i % LOCATION_SEED.length];
    return {
      id: `${customerId}-location-${i + 1}`,
      customerId,
      branchName: `${customer.city} Şube 1`,
      name: seed.name,
      type: seed.type,
      description: `${seed.name} için düzenli haşere kontrol noktası.`,
      riskLevel: (["low", "medium", "high", "critical"] as RiskLevel[])[(i + 1) % 4],
      isIndoor: !["garden", "waste_area", "loading_area"].includes(seed.type),
      stationCount: 2 + ((i * 3) % 8),
      lastCheckDate: daysFromNow(-(i * 4 + 2)),
    };
  });
}

// ---------------------------------------------------------------------------
// Dosyalar
// ---------------------------------------------------------------------------

const FILE_SEED: { name: string; category: FileCategory }[] = [
  { name: "Hizmet Sözleşmesi 2026.pdf", category: "contract" },
  { name: "Ocak Ayı Servis Raporu.pdf", category: "service_report" },
  { name: "ISO 22000 Sertifikası.pdf", category: "certificate" },
  { name: "Ürün MSDS Formu.pdf", category: "msds" },
  { name: "Faaliyet Ruhsatı.pdf", category: "license" },
  { name: "Denetim Bulgu Raporu.pdf", category: "audit_document" },
  { name: "Şubat Ayı Faturası.pdf", category: "invoice" },
  { name: "Yıllık Yenileme Teklifi.pdf", category: "offer" },
];

export function getFiles(customerId: string): FileItem[] {
  const uploaders = ["Ahmet Yılmaz", "Elif Demir", "Sistem"];
  return FILE_SEED.map((seed, i) => ({
    id: `${customerId}-file-${i + 1}`,
    customerId,
    name: seed.name,
    category: seed.category,
    uploadedBy: uploaders[i % uploaders.length],
    uploadedAt: daysFromNow(-(i * 9 + 3)),
    sizeKb: 180 + i * 240,
  }));
}

// ---------------------------------------------------------------------------
// Fotoğraflar
// ---------------------------------------------------------------------------

const PHOTO_SEED: { category: PhotoCategory; description: string; from: string; to: string }[] = [
  { category: "before", description: "Uygulama öncesi genel görünüm", from: "#64748b", to: "#334155" },
  { category: "after", description: "Uygulama sonrası genel görünüm", from: "#22c55e", to: "#15803d" },
  { category: "station", description: "Kemirgen istasyonu kontrolü", from: "#0877b2", to: "#0a3d75" },
  { category: "risk", description: "Yüksek riskli bölge tespiti", from: "#dc2626", to: "#7f1d1d" },
  { category: "hygiene", description: "Hijyen uygunsuzluğu", from: "#d97706", to: "#92400e" },
  { category: "structural_gap", description: "Duvar dibinde yapısal açıklık", from: "#7c3aed", to: "#4c1d95" },
  { category: "corrective_action", description: "Düzeltici faaliyet sonrası", from: "#0891b2", to: "#155e75" },
  { category: "general", description: "Genel saha fotoğrafı", from: "#64748b", to: "#1e293b" },
];

export function getPhotos(customerId: string): Photo[] {
  const locations = getLocations(customerId);
  return PHOTO_SEED.map((seed, i) => ({
    id: `${customerId}-photo-${i + 1}`,
    customerId,
    category: seed.category,
    description: seed.description,
    date: daysFromNow(-(i * 6 + 1)),
    location: locations[i % Math.max(locations.length, 1)]?.name ?? "Genel Alan",
    uploadedBy: i % 2 === 0 ? "Ahmet Yılmaz" : "Mehmet Kaya",
    colorFrom: seed.from,
    colorTo: seed.to,
  }));
}

export const MOCK_AI_PHOTO_ANALYSIS =
  "Fotoğrafta yapısal açıklık ve hijyen riski tespit edildi. Düzeltici faaliyet önerilir.";

// ---------------------------------------------------------------------------
// Notlar
// ---------------------------------------------------------------------------

const NOTE_SEED: { title: string; content: string; priority: NotePriority; tags: string[] }[] = [
  {
    title: "Sözleşme yenileme görüşmesi",
    content: "Müşteri ile yıllık sözleşme yenileme koşulları görüşüldü, teklif bekleniyor.",
    priority: "high",
    tags: ["sözleşme", "satış"],
  },
  {
    title: "Depo girişinde açıklık",
    content: "Yükleme kapısı altında 2 cm'lik açıklık tespit edildi, düzeltici faaliyet talep edildi.",
    priority: "critical",
    tags: ["risk", "yapısal"],
  },
  {
    title: "Fatura bilgisi güncellendi",
    content: "Fatura e-posta adresi muhasebe departmanı talebiyle güncellendi.",
    priority: "normal",
    tags: ["finans"],
  },
  {
    title: "Genel memnuniyet görüşmesi",
    content: "Yetkili ile yapılan görüşmede hizmetten memnuniyet teyit edildi.",
    priority: "low",
    tags: ["memnuniyet"],
  },
];

export function getNotes(customerId: string): Note[] {
  const authors = ["Ahmet Yılmaz", "Elif Demir", "Mehmet Kaya"];
  return NOTE_SEED.map((seed, i) => ({
    id: `${customerId}-note-${i + 1}`,
    customerId,
    title: seed.title,
    content: seed.content,
    author: authors[i % authors.length],
    date: daysFromNow(-(i * 5 + 2)),
    priority: seed.priority,
    tags: seed.tags,
    reminderDate: i === 0 ? daysFromNow(7) : null,
  }));
}

// ---------------------------------------------------------------------------
// Sözleşmeler
// ---------------------------------------------------------------------------

export function getContracts(customerId: string): Contract[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  const remainingDays = customer.contractEndDate
    ? Math.round((new Date(customer.contractEndDate).getTime() - Date.now()) / 86_400_000)
    : -30;
  const status: ContractStatus =
    remainingDays < 0 ? "expired" : remainingDays <= 30 ? "expiring" : "active";
  return [
    {
      id: `${customerId}-contract-1`,
      customerId,
      contractNo: `SZL-2026-${customer.accountCode.split("-")[1]}`,
      serviceType: customer.serviceType,
      startDate: daysFromNow(-330),
      endDate: customer.contractEndDate ?? daysFromNow(-30),
      monthlyAmount: 3200 + Number(customer.accountCode.split("-")[1]) * 450,
      currency: "TRY",
      status,
      remainingDays,
      fileName: "Hizmet Sözleşmesi 2026.pdf",
    },
    {
      id: `${customerId}-contract-2`,
      customerId,
      contractNo: `SZL-2025-${customer.accountCode.split("-")[1]}`,
      serviceType: customer.serviceType,
      startDate: daysFromNow(-695),
      endDate: daysFromNow(-330),
      monthlyAmount: 2900,
      currency: "TRY",
      status: "cancelled",
      remainingDays: -330,
      fileName: "Hizmet Sözleşmesi 2025.pdf",
    },
  ];
}

// ---------------------------------------------------------------------------
// Teklifler
// ---------------------------------------------------------------------------

export function getOffers(customerId: string): Offer[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  const statuses: OfferStatus[] = ["sent", "accepted", "draft", "rejected"];
  return statuses.map((status, i) => {
    const items: OfferItem[] = [
      { id: `${customerId}-offer-${i + 1}-item-1`, description: customer.serviceType, unitPrice: 3200, quantity: 12 },
      { id: `${customerId}-offer-${i + 1}-item-2`, description: "Ek İstasyon Kurulumu", unitPrice: 450, quantity: 4 },
    ];
    const amount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return {
      id: `${customerId}-offer-${i + 1}`,
      customerId,
      offerNo: `TKL-2026-${pad(i + 1)}`,
      title: `${customer.serviceType} Yıllık Teklifi`,
      amount,
      currency: "TRY",
      validUntil: daysFromNow(20 - i * 5),
      status,
      createdAt: daysFromNow(-(i * 12 + 3)),
      items,
    };
  });
}

// ---------------------------------------------------------------------------
// İş Geçmişi
// ---------------------------------------------------------------------------

export function getWorkOrders(customerId: string): WorkOrder[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  const statuses: WorkOrderStatus[] = ["completed", "completed", "delayed", "planned", "in_progress"];
  const technicians = ["Ahmet Yılmaz", "Mehmet Kaya", "Elif Demir"];
  return statuses.map((status, i) => ({
    id: `${customerId}-wo-${i + 1}`,
    customerId,
    orderNo: `IS-2026-${customer.accountCode.split("-")[1]}${pad(i + 1, 2)}`,
    serviceType: customer.serviceType,
    technician: technicians[i % technicians.length],
    plannedDate: daysFromNow(status === "planned" ? 5 + i : -(i * 8 + 2)),
    completedDate: status === "completed" ? daysFromNow(-(i * 8 + 1)) : null,
    status,
    riskFinding:
      i === 1 ? "2 istasyonda yüksek aktivite tespit edildi" : i === 2 ? "Kontrol gecikmesi nedeniyle risk artışı" : null,
    hasReport: status === "completed",
    productsUsed: ["Jel Yem", "Feromon Tuzak", "Sprey Uygulama"].slice(0, 1 + (i % 3)),
    stationsChecked: 6 + i * 2,
    technicianNote:
      status === "completed"
        ? "Tüm istasyonlar kontrol edildi, aktivite normal seviyede."
        : "Servis henüz tamamlanmadı.",
    customerSigned: status === "completed",
  }));
}

// ---------------------------------------------------------------------------
// Cari Hesap
// ---------------------------------------------------------------------------

export function getTransactions(customerId: string): AccountTransaction[] {
  const customer = getCustomerById(customerId);
  if (!customer) return [];
  let balance = 0;
  const rows: Omit<AccountTransaction, "balance">[] = [
    {
      id: `${customerId}-tx-1`,
      customerId,
      date: daysFromNow(-60),
      type: "invoice",
      description: "Aylık hizmet faturası",
      debit: 3200,
      credit: 0,
      status: "completed",
    },
    {
      id: `${customerId}-tx-2`,
      customerId,
      date: daysFromNow(-55),
      type: "collection",
      description: "Havale ile tahsilat",
      debit: 0,
      credit: 3200,
      status: "completed",
    },
    {
      id: `${customerId}-tx-3`,
      customerId,
      date: daysFromNow(-30),
      type: "invoice",
      description: "Aylık hizmet faturası",
      debit: 3200,
      credit: 0,
      status: "completed",
    },
    {
      id: `${customerId}-tx-4`,
      customerId,
      date: daysFromNow(-10),
      type: "discount",
      description: "Sadakat iskontosu",
      debit: 0,
      credit: 150,
      status: "completed",
    },
    {
      id: `${customerId}-tx-5`,
      customerId,
      date: daysFromNow(-2),
      type: customer.pendingCollection > 0 ? "invoice" : "manual",
      description: customer.pendingCollection > 0 ? "Aylık hizmet faturası" : "Bakiye düzeltmesi",
      debit: customer.pendingCollection > 0 ? customer.pendingCollection : 0,
      credit: 0,
      status: customer.pendingCollection > 0 ? "pending" : "completed",
    },
  ];

  return rows.map((row) => {
    balance = balance + row.debit - row.credit;
    return { ...row, balance };
  });
}

// ---------------------------------------------------------------------------
// Son Aktiviteler (Genel Bakış sekmesi için)
// ---------------------------------------------------------------------------

export function getActivity(customerId: string): ActivityItem[] {
  return [
    {
      id: `${customerId}-act-1`,
      customerId,
      type: "service_completed",
      message: "Rutin haşere kontrolü tamamlandı",
      date: daysFromNow(-3),
    },
    {
      id: `${customerId}-act-2`,
      customerId,
      type: "offer_sent",
      message: "Yıllık yenileme teklifi gönderildi",
      date: daysFromNow(-8),
    },
    {
      id: `${customerId}-act-3`,
      customerId,
      type: "contract_uploaded",
      message: "Hizmet sözleşmesi sisteme yüklendi",
      date: daysFromNow(-45),
    },
    {
      id: `${customerId}-act-4`,
      customerId,
      type: "payment_received",
      message: "Cari hesaba tahsilat kaydedildi",
      date: daysFromNow(-55),
    },
    {
      id: `${customerId}-act-5`,
      customerId,
      type: "note_added",
      message: "Operasyon ekibi tarafından not eklendi",
      date: daysFromNow(-60),
    },
  ];
}

// ---------------------------------------------------------------------------
// AI Müşteri İçgörüleri (mock)
// ---------------------------------------------------------------------------

export function getAiInsights(customerId: string): string[] {
  const customer = getCustomerById(customerId);
  const contractDays = customer?.contractEndDate
    ? Math.max(0, Math.round((new Date(customer.contractEndDate).getTime() - Date.now()) / 86_400_000))
    : null;

  return [
    "Bu müşteride son 3 ayda kemirgen aktivitesi artış eğiliminde.",
    contractDays !== null
      ? `Sözleşme bitişine ${contractDays} gün kaldı.`
      : "Sözleşme süresi doldu, yenileme görüşmesi başlatılmalı.",
    "Son serviste 2 istasyon kontrol edilmemiş.",
    "Tahsilat vadesi 5 gün geçmiş.",
  ];
}
