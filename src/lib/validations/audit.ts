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
