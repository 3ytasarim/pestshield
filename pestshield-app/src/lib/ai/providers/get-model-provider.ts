import "server-only";
import { AnthropicAiProvider } from "@/lib/ai/providers/anthropic-model-provider";
import { OpenAiProvider } from "@/lib/ai/providers/openai-model-provider";
import { AiProviderNotConfiguredError, type AiModelProvider } from "@/lib/ai/providers/model-provider";

/** `AI_PROVIDER` ortam değişkenine göre yapılandırılmış AiModelProvider'ı döndürür. */
export function getAiModelProvider(): AiModelProvider {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new AiProviderNotConfiguredError();

  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS || process.env.AI_REQUEST_TIMEOUT || 20000);

  switch (provider) {
    case "anthropic":
      return new AnthropicAiProvider(apiKey, timeoutMs);
    case "openai":
      return new OpenAiProvider(apiKey, timeoutMs);
    default:
      throw new AiProviderNotConfiguredError(`AI_PROVIDER="${provider}" desteklenmiyor. Desteklenenler: "anthropic", "openai".`);
  }
}
