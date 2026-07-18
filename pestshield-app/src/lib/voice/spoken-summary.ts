// PestShield AI Command Center — Faz 4 kısa sesli özet üretimi.
//
// Uzun tabloları satır satır OKUMAZ (spesifikasyon kuralı). Her AiToolResult
// zaten kısa, Türkçe bir `message` cümlesiyle üretiliyor (bkz.
// src/lib/ai/tools/executor.ts — her case bir `message` alanı döndürür) —
// bu yüzden ayrı bir "özetleme" katmanı icat ETMEK yerine bu mevcut, zaten
// doğrulanmış metni yeniden kullanır; liste içeren sonuçlarda kullanıcıyı
// ekrana yönlendiren kısa bir ek cümle eklenir.
import type { AiToolResult } from "@/lib/ai/types";

const LIST_RESPONSE_TYPES = new Set([
  "service_list",
  "periodic_service_list",
  "payment_table",
  "customer_list",
  "contract_list",
  "risk_list",
  "corrective_action_list",
  "technician_schedule",
  "technician_workload",
]);

export function buildSpokenSummary(result: AiToolResult): string {
  if (LIST_RESPONSE_TYPES.has(result.responseType)) {
    return `${result.message} Detayları ekranda gösteriyorum.`;
  }
  return result.message;
}
