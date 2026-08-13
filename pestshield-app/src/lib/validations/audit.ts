import { z } from "zod";

export const capaFormSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  standard: z.enum(["haccp", "brcgs", "iso22000", "fssc", "none"]),
  customerId: z.string(),
  source: z.enum(["internal_audit", "external_audit", "customer_complaint", "routine_inspection"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  rootCause: z.string().min(3, "Kök neden zorunludur"),
  actionPlan: z.string().min(3, "Aksiyon planı zorunludur"),
  responsible: z.string().min(2, "Sorumlu kişi zorunludur"),
  dueDate: z.string().min(1, "Vade tarihi zorunludur"),
});

export type CapaFormValues = z.infer<typeof capaFormSchema>;

export const riskFormSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  category: z.enum(["biological", "chemical", "physical", "operational", "regulatory"]),
  description: z.string().min(3, "Açıklama zorunludur"),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  mitigation: z.string().min(3, "Önlem planı zorunludur"),
  owner: z.string().min(2, "Sorumlu kişi zorunludur"),
  customerId: z.string(),
});

export type RiskFormValues = z.infer<typeof riskFormSchema>;

export const riskPatchSchema = riskFormSchema.extend({
  status: z.enum(["open", "mitigating", "closed"]).optional(),
});

export type RiskPatchValues = z.infer<typeof riskPatchSchema>;

export const auditRecordFormSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçiniz"),
  standard: z.enum(["haccp", "brcgs", "iso22000", "fssc"]),
  type: z.enum(["internal", "external", "certification"]),
  auditor: z.string().min(2, "Denetçi/kurum adı zorunludur"),
  scheduledDate: z.string().min(1, "Tarih zorunludur"),
});

export type AuditRecordFormValues = z.infer<typeof auditRecordFormSchema>;

export const auditRecordResultFormSchema = z.object({
  result: z.enum(["passed", "passed_with_findings", "failed"]),
  completedDate: z.string().min(1, "Tamamlanma tarihi zorunludur"),
  score: z.number().min(0).max(100).nullable().optional(),
});

export type AuditRecordResultFormValues = z.infer<typeof auditRecordResultFormSchema>;

export const auditRecordEditSchema = auditRecordFormSchema.extend({
  result: z.enum(["scheduled", "passed", "passed_with_findings", "failed"]),
  completedDate: z.string().nullable().optional(),
  score: z.number().min(0).max(100).nullable().optional(),
});

export type AuditRecordEditValues = z.infer<typeof auditRecordEditSchema>;
