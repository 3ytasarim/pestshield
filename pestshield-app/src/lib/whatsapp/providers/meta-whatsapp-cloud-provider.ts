import "server-only";
// PestShield AI Command Center — Faz 4 resmi WhatsApp sağlayıcısı (Meta Cloud API).
// Yalnızca sunucu tarafında import edilmelidir — WHATSAPP_ACCESS_TOKEN'ı tutar.
// Gerçek uç nokta: https://graph.facebook.com/{version}/{phoneNumberId}/messages

import type { WhatsAppProvider, WhatsAppSendResult, WhatsAppTemplateMessageParams } from "@/lib/whatsapp/types";

export class MetaWhatsAppCloudProvider implements WhatsAppProvider {
  readonly name = "meta-whatsapp-cloud";

  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly apiVersion: string,
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  async sendTemplateMessage(params: WhatsAppTemplateMessageParams): Promise<WhatsAppSendResult> {
    if (!this.isConfigured) {
      return { success: false, errorCode: "not_configured", errorMessage: "WhatsApp entegrasyonu yapılandırılmamış." };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: params.to.replace("+", ""),
      type: "template",
      template: {
        name: params.templateName,
        language: { code: params.languageCode },
        components:
          params.bodyVariables.length > 0
            ? [{ type: "body", parameters: params.bodyVariables.map((v) => ({ type: "text", text: v })) }]
            : undefined,
      },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };

      if (!res.ok || data.error) {
        return { success: false, errorCode: String(data.error?.code ?? res.status), errorMessage: data.error?.message ?? "WhatsApp mesajı gönderilemedi." };
      }
      return { success: true, providerMessageId: data.messages?.[0]?.id };
    } catch (error) {
      return { success: false, errorCode: "network_error", errorMessage: error instanceof Error ? error.message : "WhatsApp sağlayıcısına bağlanılamadı." };
    }
  }
}
