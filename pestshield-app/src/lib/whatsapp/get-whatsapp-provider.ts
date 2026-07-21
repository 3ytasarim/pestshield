import "server-only";

import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
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

/** Kiracı başına DB'de şifreli saklanan WhatsApp (Meta Cloud API) bilgilerinden bir sağlayıcı kurar. */
export async function getWhatsAppProvider(ownerId: string): Promise<WhatsAppProvider> {
  const integration = await prisma.whatsAppIntegration.findUnique({ where: { ownerId } });
  if (!integration) return new UnconfiguredWhatsAppProvider();

  const accessToken = decryptSecret(integration.accessTokenEnc);
  return new MetaWhatsAppCloudProvider(accessToken, integration.phoneNumberId, integration.apiVersion);
}
