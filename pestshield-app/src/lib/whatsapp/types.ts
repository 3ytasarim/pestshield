// PestShield AI Command Center — Faz 4 WhatsApp sağlayıcı soyutlaması.
//
// Bu arayüzü SADECE resmi sağlayıcı implementasyonları (Meta WhatsApp Cloud
// API) veya test sağlayıcısı implemente eder. Hiçbir zaman WhatsApp Web
// scraping, tarayıcı otomasyonu veya QR oturum ele geçirme kullanılmaz
// (spesifikasyon kural 13/47).

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface WhatsAppTemplateMessageParams {
  to: string; // E.164, "+" ile
  templateName: string;
  languageCode: string;
  /** Sırayla {{1}}, {{2}}, ... yerine geçecek gövde değişkenleri — HER ZAMAN güvenilir uygulama kodu tarafından doldurulur (bkz. templates.ts), LLM asla serbest metin geçemez. */
  bodyVariables: string[];
}

export interface WhatsAppProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  sendTemplateMessage(params: WhatsAppTemplateMessageParams): Promise<WhatsAppSendResult>;
}
