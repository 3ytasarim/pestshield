// PestShield AI Command Center — Faz 2 yönetici özeti uç noktası.
//
// Bu route SADECE zaten deterministik olarak hesaplanmış, istemci
// tarafından gönderilen yapılandırılmış veriyi (KPI'lar, karşılaştırmalar)
// modele yorumlatır — hiçbir ham kayıt veya kullanıcı serbest metni
// modele iletilmez. Model kullanılamıyorsa (AI_API_KEY yok) rapor/analiz
// akışı BAŞARISIZ OLMAZ — sadece yönetici özeti bölümü atlanır (bkz.
// Faz 2 spesifikasyonu bölüm 27).

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAiModelProvider } from "@/lib/ai/providers/get-model-provider";
import { AiProviderNotConfiguredError } from "@/lib/ai/providers/model-provider";
import { buildExecutiveSummaryPrompt, buildExecutiveSummaryUserMessage, EXECUTIVE_SUMMARY_PROMPT_VERSION } from "@/lib/ai/prompts/executive-summary-prompt";

export const runtime = "nodejs";

const MODEL = process.env.AI_MODEL || "claude-sonnet-4-5";
const MAX_TOKENS = 700;
const REQUEST_TIMEOUT = Number(process.env.AI_REQUEST_TIMEOUT_MS || process.env.AI_REQUEST_TIMEOUT || 20000);
const FALLBACK_MESSAGE = "Sayısal analiz hazırlandı ancak AI yönetici özeti oluşturulamadı.";

interface ExecutiveSummaryShape {
  headline: string;
  summary: string;
  keyFindings: string[];
  risks: string[];
  recommendations: string[];
  limitations: string[];
}

function isValidShape(value: unknown): value is ExecutiveSummaryShape {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.headline === "string" &&
    typeof v.summary === "string" &&
    Array.isArray(v.keyFindings) &&
    Array.isArray(v.risks) &&
    Array.isArray(v.recommendations) &&
    Array.isArray(v.limitations)
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: { data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ message: "Analiz verisi eksik." }, { status: 400 });
  }
  // Kaba bir boyut sınırı — bu uç nokta zaten hesaplanmış özet veri alır, ham kayıt akışı değildir.
  if (JSON.stringify(body.data).length > 20_000) {
    return NextResponse.json({ message: "Analiz verisi çok büyük." }, { status: 400 });
  }

  let modelProvider;
  try {
    modelProvider = getAiModelProvider();
  } catch (error) {
    if (error instanceof AiProviderNotConfiguredError) {
      return NextResponse.json({ success: false, message: FALLBACK_MESSAGE });
    }
    throw error;
  }

  try {
    const response = await modelProvider.createMessage({
      model: MODEL,
      maxTokens: MAX_TOKENS,
      timeoutMs: REQUEST_TIMEOUT,
      system: buildExecutiveSummaryPrompt(),
      tools: [],
      messages: [{ role: "user", content: buildExecutiveSummaryUserMessage(body.data) }],
    });

    const cleaned = response.text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
    const parsed: unknown = JSON.parse(cleaned);
    if (!isValidShape(parsed)) {
      return NextResponse.json({ success: false, message: FALLBACK_MESSAGE });
    }

    return NextResponse.json({
      success: true,
      summary: { ...parsed, generatedByAi: true, promptVersion: EXECUTIVE_SUMMARY_PROMPT_VERSION },
    });
  } catch {
    // Model hatası/timeout/geçersiz JSON — deterministik rapor akışını bozmadan sessizce düşer.
    return NextResponse.json({ success: false, message: FALLBACK_MESSAGE });
  }
}
