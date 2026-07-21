// WhatsApp mesaj şablonları ve wa.me "click-to-chat" bağlantı üretimi.
//
// Bu yardımcılar İş Emirleri, Ödeme Takibi ve Cari Hesap sayfalarındaki hızlı
// "WhatsApp ile Gönder" butonları için kullanılır: mesaj içeriği önceden
// doldurulmuş olarak WhatsApp'ı açar, gönderimi kullanıcı kendi hesabından
// onaylar. Gerçek otomatik (onaysız) Meta Cloud API gönderimi ayrı bir sistemdir
// — bkz. `src/lib/whatsapp/get-whatsapp-provider.ts` (kiracı başına DB'de
// şifreli saklanan Access Token, Entegrasyonlar sayfasından bağlanır).

/** Türkiye telefon numaralarını wa.me formatına çevirir: "0532 100 10 20" -> "905321001020" */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `90${digits.slice(1)}`;
  return `90${digits}`;
}

export function getWhatsAppLink(phone: string, message: string): string {
  const formatted = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

interface WorkOrderMessageParams {
  contactName: string;
  companyName: string;
  serviceType: string;
  plannedDate: string;
  technician: string;
  orderNo: string;
}

export function buildWorkOrderMessage(p: WorkOrderMessageParams): string {
  return [
    `Sayın ${p.contactName},`,
    "",
    `${p.companyName} için *${p.serviceType}* hizmeti planlanmıştır.`,
    "",
    `📅 Tarih: ${p.plannedDate}`,
    `🔧 Teknisyen: ${p.technician}`,
    `📋 İş Emri No: ${p.orderNo}`,
    "",
    "Sorularınız için bize ulaşabilirsiniz.",
    "",
    "PestShield Haşere Yönetim Hizmetleri",
  ].join("\n");
}

interface PaymentReminderParams {
  contactName: string;
  companyName: string;
  amount: string;
  overdueDays?: number;
}

export function buildPaymentReminderMessage(p: PaymentReminderParams): string {
  const overdueLine = p.overdueDays && p.overdueDays > 0 ? `Ödeme vadesi *${p.overdueDays} gün* geçmiştir.` : "Ödeme vadeniz yaklaşmaktadır.";
  return [
    `Sayın ${p.contactName},`,
    "",
    `${p.companyName} hesabınızda *${p.amount}* tutarında bekleyen ödeme bulunmaktadır.`,
    overdueLine,
    "",
    "Ödemenizi en kısa sürede gerçekleştirmenizi rica ederiz. Herhangi bir sorunuz için bize ulaşabilirsiniz.",
    "",
    "PestShield Haşere Yönetim Hizmetleri",
  ].join("\n");
}

interface PotentialCustomerMessageParams {
  contactName: string;
  companyName: string;
}

export function buildPotentialCustomerMessage(p: PotentialCustomerMessageParams): string {
  return [
    `Sayın ${p.contactName},`,
    "",
    `${p.companyName} için haşere yönetimi hizmetlerimiz hakkında bilgi almak ister misiniz?`,
    "Size uygun bir zaman planlayıp ücretsiz keşif/teklif sunabiliriz.",
    "",
    "Görüşmek dileğiyle,",
    "PestShield Haşere Yönetim Hizmetleri",
  ].join("\n");
}
