// PestShield AI Command Center — Faz 4 test amaçlı WhatsApp sağlayıcısı.
// SADECE birim testlerinde doğrudan import edilir — get-whatsapp-provider.ts
// FACTORY'si bu sınıfı ASLA döndürmez (spesifikasyon: "Unconfigured provider
// does not simulate sending" — gerçek uygulama akışında hiçbir zaman sahte
// başarı üretilmez).

import type { WhatsAppProvider, WhatsAppSendResult, WhatsAppTemplateMessageParams } from "@/lib/whatsapp/types";

export class TestWhatsAppProvider implements WhatsAppProvider {
  readonly name = "test-whatsapp";
  readonly isConfigured = true;
  public sentMessages: WhatsAppTemplateMessageParams[] = [];

  async sendTemplateMessage(params: WhatsAppTemplateMessageParams): Promise<WhatsAppSendResult> {
    this.sentMessages.push(params);
    return { success: true, providerMessageId: `test-msg-${this.sentMessages.length}` };
  }
}
