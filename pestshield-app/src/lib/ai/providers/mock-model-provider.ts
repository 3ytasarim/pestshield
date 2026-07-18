// PestShield AI Command Center — testler için deterministik sahte model sağlayıcı.
// Gerçek bir API çağrısı yapmaz; sabit veya enjekte edilen bir script'e göre
// tool_use / final cevap döndürür. Yalnızca test dosyalarında kullanılır.

import type { AiModelProvider, AiModelRequest, AiModelResponse } from "@/lib/ai/providers/model-provider";

export class MockAiProvider implements AiModelProvider {
  readonly name = "mock";
  private step = 0;

  constructor(private readonly script: AiModelResponse[]) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- arayüz uyumluluğu için parametre zorunlu
  async createMessage(_request: AiModelRequest): Promise<AiModelResponse> {
    const response = this.script[Math.min(this.step, this.script.length - 1)];
    this.step += 1;
    return response;
  }
}
