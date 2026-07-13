// Telefon araması ve e-posta hatırlatma bağlantıları — WhatsApp entegrasyonundaki
// (src/lib/integrations/whatsapp.ts) "gerçek ve güvenli çalışan yöntem" mantığıyla
// aynı prensiple: tarayıcının/işletim sisteminin kendi tel:/mailto: protokol
// yönlendirmesini kullanır. Sunucu tarafında SMTP/arama altyapısı gerekmez,
// hiçbir kimlik bilgisi saklanmaz ve bugün gerçekten çalışır — kullanıcı telefon
// uygulamasını veya e-posta istemcisini kendi cihazından açıp gönderimi/aramayı
// son adımda kendisi onaylar.

export function getTelLink(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function getMailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

interface PaymentReminderEmailParams {
  contactName: string;
  companyName: string;
  amount: string;
  overdueDays?: number;
}

export function buildPaymentReminderEmail(p: PaymentReminderEmailParams): { subject: string; body: string } {
  const overdueLine =
    p.overdueDays && p.overdueDays > 0
      ? `Ödeme vadeniz ${p.overdueDays} gün geçmiştir.`
      : "Ödeme vadeniz yaklaşmaktadır.";
  const subject = `${p.companyName} — Ödeme Hatırlatması`;
  const body = [
    `Sayın ${p.contactName},`,
    "",
    `${p.companyName} hesabınızda ${p.amount} tutarında bekleyen ödeme bulunmaktadır.`,
    overdueLine,
    "",
    "Ödemenizi en kısa sürede gerçekleştirmenizi rica ederiz. Herhangi bir sorunuz için bize ulaşabilirsiniz.",
    "",
    "Saygılarımızla,",
    "PestShield Haşere Yönetim Hizmetleri",
  ].join("\n");
  return { subject, body };
}
