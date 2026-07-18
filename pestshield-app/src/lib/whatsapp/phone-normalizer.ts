// PestShield AI Command Center — Faz 4 WhatsApp telefon normalizasyonu.
// Mevcut src/lib/integrations/whatsapp.ts'teki Türkiye-özel mantığı YENİDEN
// KULLANIR — ikinci bir normalizasyon algoritması İCAT EDİLMEZ.

import { formatPhoneForWhatsApp } from "@/lib/integrations/whatsapp";

/** "0532 100 10 20" → "+905321001020" (E.164). */
export function toE164(phone: string): string {
  return `+${formatPhoneForWhatsApp(phone)}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
