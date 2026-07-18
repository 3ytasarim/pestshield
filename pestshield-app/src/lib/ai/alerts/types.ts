// PestShield AI Command Center — Faz 4 proaktif uyarı motoru tipleri.
//
// MİMARİ NOT: Bu motor, LLM'in FİİLEN KARAR VERMEDİĞİ, tamamen deterministik
// bir kural değerlendirmesidir (spesifikasyon: "Do not ask the LLM to decide
// directly whether a factual alert condition is true"). LLM yalnızca zaten
// tespit edilmiş bir AlertInstance'ı Türkçe olarak AÇIKLAYABİLİR (bkz.
// alert-explanation.ts) — hiçbir zaman bir uyarı OLUŞTURMAZ ya da önem
// derecesini DEĞİŞTİRMEZ.
//
// Bu uygulamada gerçek bir veritabanı yok (bkz. Faz 1/2/3 mimari notları) —
// bu yüzden AlertRule/AlertInstance de diğer tüm Faz 3/4 katmanları gibi
// localStorage'da saklanır (bkz. alert-store.ts). "tenantId" alanı ileride
// gerçek çok kiracılı bir backend için arayüz uyumluluğu sağlamak amacıyla
// tutulur, ancak bugünkü mimaride izolasyon tarayıcı başınadır (bkz.
// data-provider.ts'deki aynı uyarı notu).

export type AlertCategory =
  | "overdue_service"
  | "service_due_today"
  | "service_due_tomorrow"
  | "unassigned_service"
  | "technician_schedule_conflict"
  | "technician_overload"
  | "overdue_payment"
  | "payment_due_today"
  | "payment_due_tomorrow"
  | "expiring_contract"
  | "critical_risk"
  | "unresolved_corrective_action"
  | "rising_pest_activity";

export type AlertSeverity = "info" | "warning" | "high" | "critical";

export type AlertDeliveryChannel = "in_app" | "email" | "whatsapp" | "voice";

export interface AlertRule {
  id: string;
  code: AlertCategory;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  isEnabled: boolean;
  /** Dakika cinsinden — motorun bu kuralı ne sıklıkla yeniden değerlendirdiği (bkz. background/job-provider.ts). */
  evaluationFrequencyMinutes: number;
  /** Kuralın kullandığı sayısal eşik(ler) — merkezi, tek yerden yönetilir (bkz. rules.ts DEFAULT_THRESHOLDS). */
  threshold: number;
  targetRoles: Array<"ADMIN" | "TECH" | "CLIENT">;
  deliveryChannels: AlertDeliveryChannel[];
  ruleVersion: number;
}

export type AlertStatus = "active" | "acknowledged" | "snoozed" | "dismissed" | "resolved" | "expired";

export interface AlertInstance {
  id: string;
  ruleId: string;
  ruleCode: AlertCategory;
  ruleVersion: number;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Uyarının dayandığı somut, doğrulanabilir kanıt cümlesi — LLM açıklaması BUNU KULLANIR, uydurmaz. */
  evidence: string;
  sourceEntityType: "occurrence" | "invoice" | "customer" | "risk" | "corrective_action" | "technician" | null;
  sourceEntityId: string | null;
  relatedCustomerId: string | null;
  relatedCustomerName: string | null;
  relatedTechnicianName: string | null;
  navigationHref: string | null;
  firstDetectedAt: string;
  lastDetectedAt: string;
  occurrenceCount: number;
  status: AlertStatus;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  dismissedBy: string | null;
  dismissedAt: string | null;
  snoozedUntil: string | null;
  resolvedAt: string | null;
  /** tenant + kural kodu + kaynak varlık + ilgili tarih/dönemden türetilen deterministik anahtar (bkz. engine.ts). */
  deduplicationKey: string;
  createdAt: string;
  updatedAt: string;
}
