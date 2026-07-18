// PestShield AI Command Center — Anthropic (Claude) AiModelProvider implementasyonu.
// Yalnızca sunucu tarafında (Node runtime) import edilmelidir — API anahtarını tutar.

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AiModelProvider, AiModelRequest, AiModelResponse, AiModelToolCall } from "@/lib/ai/providers/model-provider";

export class AnthropicAiProvider implements AiModelProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(apiKey: string, timeoutMs: number) {
    this.client = new Anthropic({ apiKey, timeout: timeoutMs });
  }

  async createMessage(request: AiModelRequest): Promise<AiModelResponse> {
    const response = await this.client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      system: request.system,
      tools: request.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema as Anthropic.Tool["input_schema"] })),
      messages: request.messages as Anthropic.MessageParam[],
    });

    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");

    const toolCalls: AiModelToolCall[] = toolUseBlocks.map((b) => ({
      id: b.id,
      name: b.name,
      input: b.input as Record<string, unknown>,
    }));

    return {
      type: toolCalls.length > 0 ? "tool_use" : "final",
      toolCalls,
      text: textBlock?.text ?? "",
      rawAssistantContent: response.content,
    };
  }
}
