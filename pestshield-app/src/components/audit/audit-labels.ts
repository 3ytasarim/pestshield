import type {
  AuditResult,
  AuditType,
  CapaSeverity,
  CapaSource,
  CapaStatus,
  ChecklistStatus,
  ComplianceStandard,
  RiskCategory,
  RiskStatus,
} from "@/lib/mock/audit";

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  compliant: "Uygun",
  non_compliant: "Uygunsuz",
  pending: "İnceleniyor",
  not_applicable: "Kapsam Dışı",
};

export const CAPA_SEVERITY_LABELS: Record<CapaSeverity, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export const CAPA_SEVERITY_OPTIONS: { value: CapaSeverity; label: string }[] = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
  { value: "critical", label: "Kritik" },
];

export const CAPA_STATUS_LABELS: Record<CapaStatus, string> = {
  open: "Açık",
  in_progress: "Devam Ediyor",
  resolved: "Çözüldü",
  verified: "Doğrulandı",
};

export const CAPA_SOURCE_LABELS: Record<CapaSource, string> = {
  internal_audit: "İç Denetim",
  external_audit: "Dış Denetim",
  customer_complaint: "Müşteri Şikayeti",
  routine_inspection: "Rutin Kontrol",
};

export const CAPA_SOURCE_OPTIONS: { value: CapaSource; label: string }[] = [
  { value: "internal_audit", label: "İç Denetim" },
  { value: "external_audit", label: "Dış Denetim" },
  { value: "customer_complaint", label: "Müşteri Şikayeti" },
  { value: "routine_inspection", label: "Rutin Kontrol" },
];

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  biological: "Biyolojik",
  chemical: "Kimyasal",
  physical: "Fiziksel",
  operational: "Operasyonel",
  regulatory: "Regülasyon",
};

export const RISK_CATEGORY_OPTIONS: { value: RiskCategory; label: string }[] = [
  { value: "biological", label: "Biyolojik" },
  { value: "chemical", label: "Kimyasal" },
  { value: "physical", label: "Fiziksel" },
  { value: "operational", label: "Operasyonel" },
  { value: "regulatory", label: "Regülasyon" },
];

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: "Açık",
  mitigating: "Önlem Alınıyor",
  closed: "Kapandı",
};

export const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  internal: "İç Denetim",
  external: "Dış Denetim",
  certification: "Sertifikasyon",
};

export const AUDIT_RESULT_LABELS: Record<AuditResult, string> = {
  passed: "Başarılı",
  passed_with_findings: "Bulgularla Başarılı",
  failed: "Başarısız",
  scheduled: "Planlandı",
};

export const STANDARD_ROUTES: Record<ComplianceStandard, string> = {
  haccp: "/dashboard/client/haccp",
  brcgs: "/dashboard/client/brcgs",
  iso22000: "/dashboard/client/iso-22000",
  fssc: "/dashboard/client/fssc",
};
