import "server-only";

import { MetaWhatsAppCloudProvider } from "@/lib/whatsapp/providers/meta-whatsapp-cloud-provider";
import type { WhatsAppProvider, WhatsAppSendResult, WhatsAppTemplateMessageParams } from "@/lib/whatsapp/types";

/** Yapılandırılmamışken kullanılan, HER ZAMAN dürüst şekilde başarısız dönen sağlayıcı — asla "gönderildi" iddia etmez. */
class UnconfiguredWhatsAppProvider implements WhatsAppProvider {
  readonly name = "unconfigured";
  readonly isConfigured = false;
  async sendTemplateMessage(params: WhatsAppTemplateMessageParams): Promise<WhatsAppSendResult> {
    void params;
    return { success: false, errorCode: "not_configured", errorMessage: "WhatsApp entegrasyonu henüz yapılandırılmadı." };
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  const provider = process.env.WHATSAPP_PROVIDER || "meta";
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (provider === "meta" && accessToken && phoneNumberId) {
    return new MetaWhatsAppCloudProvider(accessToken, phoneNumberId, apiVersion);
  }
  return new UnconfiguredWhatsAppProvider();
}
