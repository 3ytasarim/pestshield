// PestShield AI Command Center — OpenAI AiModelProvider implementasyonu.
// Yalnızca sunucu tarafında (Node runtime) import edilmelidir — API anahtarını tutar.
//
// ÖNEMLİ TASARIM NOTU: Bu uygulamada istemci tarafı (ai-command-center.tsx)
// ve /api/ai/chat route'u, konuşma geçmişini Anthropic'in mesaj/içerik-bloğu
// formatında (content: string | {type:"text"|"tool_use"|"tool_result", ...}[])
// oluşturur ve saklar — bu, uygulamanın "kanonik" iç formatıdır. Bu provider
// bu kanonik formatı OpenAI'nin Chat Completions (function calling) formatına
// ÇEVİRİR, OpenAI'yi çağırır, sonra yanıtı TEKRAR kanonik Anthropic-şekilli
// içerik bloklarına çevirir. Böylece route.ts ve ai-command-center.tsx'te
// TEK SATIR değişiklik gerekmez — provider sınırında tam çeviri yapılır.

import "server-only";
import OpenAI from "openai";
import type { AiModelProvider, AiModelRequest, AiModelResponse, AiModelToolCall } from "@/lib/ai/providers/model-provider";

type CanonicalTextBlock = { type: "text"; text: string };
type CanonicalToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type CanonicalToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string };
type CanonicalBlock = CanonicalTextBlock | CanonicalToolUseBlock | CanonicalToolResultBlock;
type CanonicalMessage = { role: "user" | "assistant"; content: string | CanonicalBlock[] };

function isCanonicalMessage(value: unknown): value is CanonicalMessage {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && (typeof v.content === "string" || Array.isArray(v.content));
}

/** Kanonik (Anthropic-şekilli) geçmişi OpenAI Chat Completions mesaj dizisine çevirir. */
function toOpenAiMessages(system: string, messages: unknown[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  const result: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: system }];

  for (const raw of messages) {
    if (!isCanonicalMessage(raw)) continue;

    if (typeof raw.content === "string") {
      result.push({ role: raw.role, content: raw.content });
      continue;
    }

    if (raw.role === "user") {
      // Kullanıcı mesajı ya düz metin bloklarından ya da tool_result bloklarından oluşur (asla ikisi birden bu uygulamada).
      const toolResults = raw.content.filter((b): b is CanonicalToolResultBlock => b.type === "tool_result");
      if (toolResults.length > 0) {
        for (const tr of toolResults) {
          result.push({ role: "tool", tool_call_id: tr.tool_use_id, content: tr.content });
        }
        continue;
      }
      const text = raw.content
        .filter((b): b is CanonicalTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      result.push({ role: "user", content: text });
      continue;
    }

    // assistant: metin + tool_use bloklarının karışımı olabilir.
    const textBlocks = raw.content.filter((b): b is CanonicalTextBlock => b.type === "text");
    const toolUseBlocks = raw.content.filter((b): b is CanonicalToolUseBlock => b.type === "tool_use");
    result.push({
      role: "assistant",
      content: textBlocks.length > 0 ? textBlocks.map((b) => b.text).join("\n") : null,
      tool_calls:
        toolUseBlocks.length > 0
          ? toolUseBlocks.map((b) => ({ id: b.id, type: "function" as const, function: { name: b.name, arguments: JSON.stringify(b.input) } }))
          : undefined,
    });
  }

  return result;
}

export class OpenAiProvider implements AiModelProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  constructor(apiKey: string, timeoutMs: number) {
    this.client = new OpenAI({ apiKey, timeout: timeoutMs });
  }

  async createMessage(request: AiModelRequest): Promise<AiModelResponse> {
    const openAiMessages = toOpenAiMessages(request.system, request.messages);
    const tools: OpenAI.Chat.ChatCompletionTool[] = request.tools.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }));

    const response = await this.client.chat.completions.create({
      model: request.model,
      max_tokens: request.maxTokens,
      messages: openAiMessages,
      tools: tools.length > 0 ? tools : undefined,
    });

    const message = response.choices[0]?.message;
    const toolCalls: AiModelToolCall[] = (message?.tool_calls ?? [])
      .filter((tc): tc is OpenAI.Chat.ChatCompletionMessageToolCall & { type: "function" } => tc.type === "function")
      .map((tc) => {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tc.function.arguments);
        } catch {
          input = {};
        }
        return { id: tc.id, name: tc.function.name, input };
      });

    const text = message?.content ?? "";

    // Kanonik (Anthropic-şekilli) rawAssistantContent — route.ts bunu aynen geçmişe geri ekler,
    // ai-command-center.tsx bir sonraki round-trip'te bunu tekrar bu provider'a yollar.
    const canonicalContent: CanonicalBlock[] = [];
    if (text) canonicalContent.push({ type: "text", text });
    for (const call of toolCalls) canonicalContent.push({ type: "tool_use", id: call.id, name: call.name, input: call.input });

    return {
      type: toolCalls.length > 0 ? "tool_use" : "final",
      toolCalls,
      text,
      rawAssistantContent: canonicalContent,
    };
  }
}
