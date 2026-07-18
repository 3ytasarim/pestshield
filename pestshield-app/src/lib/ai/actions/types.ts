// PestShield AI Command Center — Faz 3 kontrollü yazma aksiyonu tipleri.
//
// MİMARİ NOT: Faz 1/2 ile aynı temel sınırlama geçerlidir — iş verisi
// (servisler, periyotlar, teknisyenler) sunucuda değil tarayıcı
// localStorage'ında tutulur. Bu yüzden bir "proposal" (aksiyon önerisi)
// SUNUCUDA saklanan bir kayıt değildir; LLM asla bu store'lara doğrudan
// yazamaz — sadece sabit ACTION_REGISTRY'deki tanımlı bir aksiyon adını ve
// parametrelerini önerir. Öneriyi ÇÖZÜMLEME (entity resolution), DOĞRULAMA
// (validation) ve gerçek YAZMA işlemi HER ZAMAN güvenilir istemci kodunda
// (src/lib/ai/actions/executors.ts), kullanıcının AÇIK ONAYINDAN SONRA
// çalışır — LLM çıktısından hiçbir zaman doğrudan değil.

export type AiActionType =
  | "create_service"
  | "reschedule_service"
  | "assign_technician"
  | "create_followup_task"
  | "prepare_email"
  | "send_email"
  // Faz 4 — WhatsApp gönderimi de AYNI onay çerçevesini kullanır (bkz.
  // proposal-builder.ts/executors.ts) — asla LLM'in serbest çıktısından
  // doğrudan gönderilmez.
  | "send_whatsapp_message";

export type AiActionStatus =
  | "draft"
  | "validating"
  | "requires_clarification"
  | "invalid"
  | "pending_confirmation"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface AiActionValidationIssue {
  field?: string;
  message: string;
}

export interface AiActionValidationResult {
  isValid: boolean;
  errors: AiActionValidationIssue[];
  warnings: AiActionValidationIssue[];
}

export interface AiActionPermissionResult {
  allowed: boolean;
  requiredPermission: string;
  reason?: string;
}

export interface AiActionTarget {
  entityType: "customer" | "service_order" | "occurrence" | "technician" | "risk" | "task";
  entityId: string;
  entityName: string;
}

export interface AiActionFieldChange {
  label: string;
  before: string | null;
  after: string;
}

/** Tüm aksiyon tiplerinin ortak zarfı — parametreler her actionType için ayrı ayrı tiplenir (bkz. aşağı). */
export interface AiActionProposal<TParams = Record<string, unknown>> {
  id: string;
  actionType: AiActionType;
  status: AiActionStatus;
  title: string;
  description: string;
  requestedBy: {
    userId: string;
    role: string;
  };
  target: AiActionTarget | null;
  parameters: TParams;
  /** Güncelleme aksiyonlarında önceki durum; oluşturma aksiyonlarında null. */
  before: AiActionFieldChange[] | null;
  /** Yürütmeden önce: önizleme; yürütmeden sonra: gerçekleşen sonuç. */
  after: AiActionFieldChange[];
  warnings: string[];
  validation: AiActionValidationResult;
  permissions: AiActionPermissionResult;
  /** Onay bu ID'ye bağlıdır — başka bir proposal için kullanılamaz (bkz. confirm route). */
  idempotencyKey: string;
  resultSummary?: string;
  resultNavigation?: { label: string; href: string };
  errorMessage?: string;
  createdAt: string;
  expiresAt: string;
  confirmedAt?: string;
  executedAt?: string;
}

export interface CreateServiceParams {
  customerId: string;
  customerName: string;
  branchName?: string;
  serviceType: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  technicianName?: string;
  priority?: "normal" | "high";
  notes?: string;
}

export interface RescheduleServiceParams {
  occurrenceId: string;
  newDate: string;
  newStartTime: string;
  scope: "only_this" | "this_and_following" | "all_series";
}

export interface AssignTechnicianParams {
  occurrenceId: string;
  technicianName: string;
  previousTechnicianName?: string | null;
}

export interface CreateFollowupTaskParams {
  title: string;
  description: string;
  relatedEntityType?: "customer" | "risk" | "invoice";
  relatedEntityId?: string;
  relatedEntityName?: string;
  dueDate: string;
  responsible: string;
  priority: "low" | "normal" | "high";
}

export interface PrepareEmailParams {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  templateId: string;
  attachmentLabel?: string;
}

export interface SendWhatsAppMessageParams {
  customerId: string;
  customerName: string;
  recipientPhone: string; // E.164
  recipientName: string;
  templateId: string;
  bodyVariables: string[];
  previewText: string;
}

export type AiActionParams =
  | CreateServiceParams
  | RescheduleServiceParams
  | AssignTechnicianParams
  | CreateFollowupTaskParams
  | PrepareEmailParams
  | SendWhatsAppMessageParams;

export interface AiActionExecutionResult {
  success: boolean;
  resultSummary: string;
  navigation?: { label: string; href: string };
  errorMessage?: string;
}
