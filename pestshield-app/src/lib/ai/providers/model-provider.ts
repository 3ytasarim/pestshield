// PestShield AI Command Center — LLM sağlayıcı soyutlaması.
//
// /api/ai/chat bu arayüzü kullanır, doğrudan bir SDK'ya bağımlı değildir.
// Bu sayede AI_PROVIDER ortam değişkeni değiştirilerek (ör. "openai")
// başka bir sağlayıcıya geçilebilir; API anahtarı her zaman sunucu
// tarafında kalır, frontend'e hiçbir zaman gönderilmez.

export interface AiModelToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AiModelResponse {
  type: "tool_use" | "final";
  toolCalls: AiModelToolCall[];
  text: string;
  /** Konuşma geçmişine aynen eklenecek, sağlayıcıya özgü ham içerik (tool_use/text blokları). */
  rawAssistantContent: unknown;
}

export interface AiModelRequest {
  system: string;
  /** Sağlayıcıya özgü mesaj geçmişi formatı (Anthropic.MessageParam[] vb.) — provider'lar arası taşınabilir olması beklenmez. */
  messages: unknown[];
  tools: { name: string; description: string; input_schema: Record<string, unknown> }[];
  maxTokens: number;
  model: string;
  timeoutMs: number;
}

export interface AiModelProvider {
  readonly name: string;
  createMessage(request: AiModelRequest): Promise<AiModelResponse>;
}

export class AiProviderNotConfiguredError extends Error {
  constructor(message = "AI asistanı henüz yapılandırılmadı. Sunucuda AI_API_KEY ortam değişkenini ayarlayın.") {
    super(message);
    this.name = "AiProviderNotConfiguredError";
  }
}
