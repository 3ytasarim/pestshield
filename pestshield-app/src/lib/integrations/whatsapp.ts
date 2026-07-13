// WhatsApp entegrasyonu — mesaj şablonları ve gönderim bağlantısı üretimi.
//
// ÖNEMLİ: WhatsApp Business Cloud API (Meta) ile OTOMATİK, kullanıcı onayı olmadan
// mesaj göndermek için sunucu tarafında saklanan kalıcı bir Access Token ile
// Meta'nın Graph API'sine POST isteği atmak gerekir. Bu token'ı tarayıcıda
// (client-side) kullanmak/saklamak ciddi bir güvenlik açığı olur — bu yüzden bu
// ortamda gerçek otomatik gönderim YAPILMAZ.
//
// Bunun yerine gerçek ve güvenli çalışan yöntem kullanılır: WhatsApp'ın herkese
// açık "click-to-chat" bağlantısı (wa.me). Bu, mesaj içeriği önceden doldurulmuş
// olarak WhatsApp'ı (uygulama veya web) açar; gönderme işlemini kullanıcı kendi
// WhatsApp hesabından son adımda onaylar. Token/API anahtarı gerekmez, hiçbir
// güvenlik riski taşımaz ve bugün gerçekten çalışır.
//
// Şirket gerçek Meta Cloud API kimlik bilgilerini (Phone Number ID + Access
// Token) Entegrasyonlar sayfasından girip "bağlı" hale getirebilir — bu, ileride
// bir backend eklendiğinde otomatik gönderime geçişi kolaylaştırmak için veriyi
// hazır tutar; şu an için gönderim yöntemini değiştirmez.

const STORAGE_KEY = "pestshield.integrations.whatsapp";

export interface WhatsAppConnection {
  connected: boolean;
  phoneNumberId: string;
  accessToken: string;
  businessPhone: string;
  connectedAt: string | null;
}

const DEFAULT_CONNECTION: WhatsAppConnection = {
  connected: false,
  phoneNumberId: "",
  accessToken: "",
  businessPhone: "",
  connectedAt: null,
};

export function getWhatsAppConnection(): WhatsAppConnection {
  if (typeof window === "undefined") return DEFAULT_CONNECTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONNECTION;
    return { ...DEFAULT_CONNECTION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONNECTION;
  }
}

export function saveWhatsAppConnection(conn: WhatsAppConnection) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conn));
}

export function disconnectWhatsApp() {
  saveWhatsAppConnection(DEFAULT_CONNECTION);
}

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
