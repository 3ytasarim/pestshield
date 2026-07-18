// PestShield AI Command Center — Faz 4 kontrollü WhatsApp şablon katmanı.
//
// src/lib/ai/actions/email-templates.ts ile AYNI ilke: LLM asla serbest
// WhatsApp metni üretip göndermez — sadece hangi şablonun kullanılacağını ve
// değişken DEĞERLERİNİ önerir. Değişkenleri şablona yerleştiren kod HER ZAMAN
// burasıdır. Meta WhatsApp Cloud API'de gövde değişkenleri sıralı
// ({{1}}, {{2}}, ...) olduğundan `bodyVariables` dizisi de sıralıdır.
//
// DÜRÜSTLÜK NOTU: Bu şablonların Meta Business Manager'da GERÇEKTEN onaylı
// olup olmadığı bu ortamda doğrulanamaz (gerçek kimlik bilgisi yok) —
// `approvalStatus: "pending_approval"` bunu açıkça işaretler. Gönderim
// öncesi UI bu durumu kullanıcıya gösterir (bkz. whatsapp-message-preview.tsx).

export type WhatsAppTemplateId = "service_appointment_reminder" | "payment_reminder" | "service_completion_summary";

export type WhatsAppTemplateApprovalStatus = "approved" | "pending_approval";

export interface WhatsAppTemplateDefinition {
  id: WhatsAppTemplateId;
  providerTemplateName: string;
  category: "utility" | "marketing";
  language: string;
  approvalStatus: WhatsAppTemplateApprovalStatus;
  label: string;
  /** Önizleme metni üretici — SIRALI değişken değerlerini alır, {{1}} vb. yerine koyar. */
  bodyVariableLabels: string[];
}

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplateId, WhatsAppTemplateDefinition> = {
  service_appointment_reminder: {
    id: "service_appointment_reminder",
    providerTemplateName: "pestshield_service_appointment_reminder",
    category: "utility",
    language: "tr",
    approvalStatus: "pending_approval",
    label: "Servis Randevu Hatırlatması",
    bodyVariableLabels: ["Müşteri adı", "Servis türü", "Tarih", "Saat", "Teknisyen"],
  },
  payment_reminder: {
    id: "payment_reminder",
    providerTemplateName: "pestshield_payment_reminder",
    category: "utility",
    language: "tr",
    approvalStatus: "pending_approval",
    label: "Ödeme Hatırlatması",
    bodyVariableLabels: ["Müşteri adı", "Tutar", "Gecikme (gün)"],
  },
  service_completion_summary: {
    id: "service_completion_summary",
    providerTemplateName: "pestshield_service_completion_summary",
    category: "utility",
    language: "tr",
    approvalStatus: "pending_approval",
    label: "Servis Tamamlama Özeti",
    bodyVariableLabels: ["Müşteri adı", "Servis türü", "Tarih"],
  },
};

export interface WhatsAppTemplateVariables {
  customerName: string;
  serviceType?: string;
  serviceDate?: string;
  serviceTime?: string;
  technicianName?: string;
  amount?: string;
  overdueDays?: string;
}

/** Şablonun sıralı değişken listesini (Meta API'ye gidecek gerçek `bodyVariables`) ve önizleme metnini üretir. */
export function resolveWhatsAppTemplate(templateId: WhatsAppTemplateId, vars: WhatsAppTemplateVariables): { bodyVariables: string[]; previewText: string } {
  switch (templateId) {
    case "service_appointment_reminder": {
      const bodyVariables = [vars.customerName, vars.serviceType ?? "-", vars.serviceDate ?? "-", vars.serviceTime ?? "-", vars.technicianName ?? "-"];
      return { bodyVariables, previewText: `Sayın ${vars.customerName}, ${vars.serviceType ?? "servis"} için ${vars.serviceDate ?? "-"} tarihinde saat ${vars.serviceTime ?? "-"} randevunuz planlanmıştır. Teknisyen: ${vars.technicianName ?? "-"}.` };
    }
    case "payment_reminder": {
      const bodyVariables = [vars.customerName, vars.amount ?? "-", vars.overdueDays ?? "0"];
      return { bodyVariables, previewText: `Sayın ${vars.customerName}, ${vars.amount ?? "-"} tutarındaki ödemeniz${vars.overdueDays && vars.overdueDays !== "0" ? ` ${vars.overdueDays} gündür` : ""} beklemektedir.` };
    }
    case "service_completion_summary": {
      const bodyVariables = [vars.customerName, vars.serviceType ?? "-", vars.serviceDate ?? "-"];
      return { bodyVariables, previewText: `Sayın ${vars.customerName}, ${vars.serviceDate ?? "-"} tarihli ${vars.serviceType ?? "servis"} tamamlanmıştır. Teşekkür ederiz.` };
    }
  }
}
