// PestShield AI Command Center — Faz 3 onaylı e-posta şablonları.
//
// LLM asla ham HTML/script içeriği üretip göndermez — sadece hangi
// şablonun kullanılacağını ve değişken değerlerini (müşteri adı, tarih
// vb.) önerir. Değişkenleri ŞABLONA yerleştiren ve son metni üreten kod
// HER ZAMAN burasıdır (güvenilir uygulama kodu), LLM'in serbest metni
// değil. Faz 3.1 kapsamında 3 şablon uygulanır (spesifikasyon bölüm 11'de
// listelenen 7 şablonun en sık kullanılan 3'ü) — kalanlar Faz 3.2'ye
// bırakılmıştır (bkz. final rapor).

export type EmailTemplateId = "service_appointment_confirmation" | "payment_reminder" | "service_report_delivery";

export interface EmailTemplateVariables {
  customerName: string;
  contactName?: string;
  branchName?: string;
  serviceDate?: string;
  serviceTime?: string;
  technicianName?: string;
  amount?: string;
  dueDate?: string;
  reportLink?: string;
  companyName: string;
  companyPhone?: string;
}

function escapePlainText(value: string): string {
  // E-posta gövdesi düz metindir (nodemailer text alanı) — HTML/script enjeksiyonu zaten mümkün değildir,
  // yine de kontrol dışı karakterleri (satır sonu enjeksiyonu vb.) temizler.
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function resolveEmailTemplate(templateId: EmailTemplateId, vars: EmailTemplateVariables): { subject: string; body: string } {
  const customer = escapePlainText(vars.customerName);
  const contact = vars.contactName ? escapePlainText(vars.contactName) : customer;
  const company = escapePlainText(vars.companyName);

  switch (templateId) {
    case "service_appointment_confirmation":
      return {
        subject: `Servis Randevusu Onayı — ${vars.serviceDate ?? ""}`,
        body: `Sayın ${contact},\n\n${customer}${vars.branchName ? ` (${escapePlainText(vars.branchName)})` : ""} için ${vars.serviceDate ?? "-"} tarihinde saat ${vars.serviceTime ?? "-"} planlanan servis randevunuz onaylanmıştır.${vars.technicianName ? `\nSorumlu teknisyen: ${escapePlainText(vars.technicianName)}` : ""}\n\nSaygılarımızla,\n${company}${vars.companyPhone ? `\n${escapePlainText(vars.companyPhone)}` : ""}`,
      };
    case "payment_reminder":
      return {
        subject: `Ödeme Hatırlatması — ${customer}`,
        body: `Sayın ${contact},\n\n${customer} hesabınıza ait ${vars.amount ?? "-"} tutarındaki ödemenin${vars.dueDate ? ` (vade: ${vars.dueDate})` : ""} henüz tarafımıza ulaşmadığını bilginize sunarız. Ödemenizi en kısa sürede gerçekleştirmenizi rica ederiz.\n\nSaygılarımızla,\n${company}${vars.companyPhone ? `\n${escapePlainText(vars.companyPhone)}` : ""}`,
      };
    case "service_report_delivery":
      return {
        subject: `Servis Raporu — ${customer}`,
        body: `Sayın ${contact},\n\n${customer}${vars.branchName ? ` (${escapePlainText(vars.branchName)})` : ""} için hazırlanan servis raporu ekte/bağlantıda yer almaktadır.${vars.reportLink ? `\nRapor: ${vars.reportLink}` : ""}\n\nSaygılarımızla,\n${company}${vars.companyPhone ? `\n${escapePlainText(vars.companyPhone)}` : ""}`,
      };
  }
}

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateId, string> = {
  service_appointment_confirmation: "Servis Randevu Onayı",
  payment_reminder: "Ödeme Hatırlatması",
  service_report_delivery: "Servis Raporu Teslimi",
};
