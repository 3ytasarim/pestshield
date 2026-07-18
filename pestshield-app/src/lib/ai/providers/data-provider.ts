// PestShield AI Command Center — veri erişim soyutlaması.
//
// Tool katmanı (src/lib/ai/tools/*) hiçbir zaman Prisma'yı veya mock
// modüllerini doğrudan içe aktarmaz — sadece bu arayüzü kullanır.
//
// Gerçek implementasyon: `RemoteAiDataProvider` (tarayıcı, `/api/ai/data/*`
// uç noktalarına fetch atar) + `PrismaAiDataProvider` (sunucu, gerçek
// Postgres sorgusu + `ownerId` ile kiracı izolasyonu — bkz.
// src/app/api/ai/data/[method]/route.ts ve prisma-data-provider.ts).
// Periyot'un yalnızca zamanlama çekirdeği (PeriyotBatch/PeriyotOccurrence)
// Postgres'e taşındı; Ek-1/Kroki/istasyon kontrolü/CAPA notları henüz
// taşınmadı (ayrı bir faz).

export interface AiServiceOccurrence {
  occurrenceId: string;
  customerId: string;
  customerName: string;
  serviceOrderId: string;
  serviceName: string;
  personnelName: string;
  periodDate: string;
  startTime: string;
  endTime: string;
  isCompleted: boolean;
}

export interface AiInvoiceRecord {
  invoiceNo: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
}

export interface AiCustomerRecord {
  customerId: string;
  companyName: string;
  sector: string;
  city: string;
  status: "active" | "passive";
  riskLevel: string;
  pendingCollection: number;
  contractEndDate: string | null;
  branchCount: number;
}

export interface AiRiskRecord {
  id: string;
  title: string;
  category: string;
  likelihood: number;
  impact: number;
  status: string;
  customerId: string | null;
  customerName: string | null;
  owner: string;
}

export interface AiCorrectiveActionRecord {
  id: string;
  title: string;
  severity: string;
  status: string;
  dueDate: string;
  customerId: string | null;
  customerName: string | null;
  responsible: string;
  overdue: boolean;
}

export interface AiTechnicianRecord {
  id: string;
  name: string;
  status: string;
}

/** Faz 2: trend/karşılaştırma hesapları için TÜM risk kayıtları (açık+kapalı), tarihli. */
export interface AiRiskHistoryRecord {
  id: string;
  title: string;
  category: string;
  likelihood: number;
  impact: number;
  status: "open" | "mitigating" | "closed";
  reviewDate: string;
  customerId: string | null;
  customerName: string | null;
  owner: string;
}

/** Faz 2: kapanma oranı/trend hesapları için TÜM düzeltici faaliyetler (durumdan bağımsız). */
export interface AiCorrectiveActionHistoryRecord extends AiCorrectiveActionRecord {
  createdDate: string;
  resolvedDate: string | null;
}

/** Faz 2: denetim hazırlık skoru için checklist maddeleri. */
export interface AiChecklistRecord {
  id: string;
  standard: string;
  status: "compliant" | "non_compliant" | "pending" | "not_applicable";
  reviewDate: string;
}

/**
 * AI Command Center'ın ihtiyaç duyduğu tüm salt-okunur veri erişimi bu
 * arayüzden geçer. Her yeni backend (Prisma, REST API vb.) bu arayüzü
 * implemente ederek tool katmanına dokunmadan takılabilir.
 */
export interface AiDataProvider {
  readonly name: string;
  getServiceOccurrences(): Promise<AiServiceOccurrence[]>;
  getInvoices(): Promise<AiInvoiceRecord[]>;
  getCustomers(): Promise<AiCustomerRecord[]>;
  getCustomerBalance(customerId: string): Promise<{ balance: number; isOverdue: boolean; overdueDays: number }>;
  getOpenRisks(): Promise<AiRiskRecord[]>;
  getOpenCorrectiveActions(): Promise<AiCorrectiveActionRecord[]>;
  getTechnicians(): Promise<AiTechnicianRecord[]>;
  /** Faz 2 — trend/karşılaştırma/dağılım hesapları için tarihli, tam risk geçmişi. */
  getAllRisks(): Promise<AiRiskHistoryRecord[]>;
  /** Faz 2 — kapanma oranı/trend hesapları için tüm düzeltici faaliyetler. */
  getAllCorrectiveActions(): Promise<AiCorrectiveActionHistoryRecord[]>;
  /** Faz 2 — denetim hazırlık skoru için checklist maddeleri. */
  getChecklistItems(): Promise<AiChecklistRecord[]>;
}
