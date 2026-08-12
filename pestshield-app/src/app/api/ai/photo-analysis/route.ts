// PestShield AI Command Center — "Fotoğraf Analizi" görsel analiz uç noktası.
//
// Kullanıcının yüklediği saha fotoğrafını doğrudan Claude'un görüntü
// girişine gönderir (executive-summary route'undaki gibi yapılandırılmış
// veri değil, gerçek bir görsel). Model yapılandırılmamışsa istek net bir
// hata döner — bu özellik için sessiz düşme (fallback) uygun değildir,
// çünkü analiz sonucunun kendisi bu çağrıya bağımlıdır.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAiModelProvider } from "@/lib/ai/providers/get-model-provider";
import { AiProviderNotConfiguredError } from "@/lib/ai/providers/model-provider";

export const runtime = "nodejs";

const MODEL = process.env.AI_MODEL || "claude-sonnet-4-5";
const MAX_TOKENS = 900;
const REQUEST_TIMEOUT = Number(process.env.AI_REQUEST_TIMEOUT_MS || process.env.AI_REQUEST_TIMEOUT || 30000);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const SYSTEM_PROMPT = `Sen PestShield'ın haşere kontrolü (pest control) alanında uzman bir görsel analiz asistanısın. Sana sahadan çekilmiş bir fotoğraf verilecek (istasyon, tuzak, zararlı izi, hasar, tesis alanı vb. olabilir).

Fotoğrafı incele ve SADECE gördüğün somut kanıtlara dayanarak değerlendir. Emin olmadığın konularda kesin iddialarda bulunma, "görünüşe göre" / "olası" gibi ifadeler kullan. Türkçe yanıt ver.

Yanıtını SADECE şu JSON şemasına uyan, başka hiçbir metin içermeyen bir JSON nesnesi olarak ver:
{
  "summary": "Fotoğrafta görülenlerin 1-2 cümlelik özeti",
  "findings": ["Gözlemlenen somut bulgu 1", "Gözlemlenen somut bulgu 2"],
  "riskLevel": "low" | "medium" | "high" | "unknown",
  "riskReason": "Risk seviyesi değerlendirmesinin kısa gerekçesi",
  "recommendations": ["Önerilen aksiyon 1", "Önerilen aksiyon 2"],
  "disclaimer": "Bu analiz bir yapay zeka görsel değerlendirmesidir, profesyonel saha denetiminin yerini tutmaz."
}

Fotoğrafta haşere kontrolüyle ilgili hiçbir şey yoksa (alakasız bir görsel) riskLevel'ı "unknown" yap ve bunu summary'de belirt.`;

interface PhotoAnalysisShape {
  summary: string;
  findings: string[];
  riskLevel: "low" | "medium" | "high" | "unknown";
  riskReason: string;
  recommendations: string[];
  disclaimer: string;
}

function isValidShape(value: unknown): value is PhotoAnalysisShape {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.summary === "string" &&
    Array.isArray(v.findings) &&
    typeof v.riskLevel === "string" &&
    ["low", "medium", "high", "unknown"].includes(v.riskLevel) &&
    typeof v.riskReason === "string" &&
    Array.isArray(v.recommendations) &&
    typeof v.disclaimer === "string"
  );
}

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const match = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mediaType, base64] = match;
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) return null;
  const approxBytes = (base64.length * 3) / 4;
  if (approxBytes > MAX_IMAGE_BYTES) return null;
  return { mediaType, base64 };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: { image?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (!body.image || typeof body.image !== "string") {
    return NextResponse.json({ message: "Fotoğraf eksik." }, { status: 400 });
  }

  const parsed = parseDataUrl(body.image);
  if (!parsed) {
    return NextResponse.json({ message: "Fotoğraf formatı desteklenmiyor veya çok büyük (maks. 8 MB, JPG/PNG/WEBP/GIF)." }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.slice(0, 500) : "";

  let modelProvider;
  try {
    modelProvider = getAiModelProvider();
  } catch (error) {
    if (error instanceof AiProviderNotConfiguredError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 503 });
    }
    throw error;
  }

  try {
    const response = await modelProvider.createMessage({
      model: MODEL,
      maxTokens: MAX_TOKENS,
      timeoutMs: REQUEST_TIMEOUT,
      system: SYSTEM_PROMPT,
      tools: [],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: parsed.mediaType, data: parsed.base64 } },
            { type: "text", text: note ? `Ek not: ${note}` : "Bu fotoğrafı analiz et." },
          ],
        },
      ],
    });

    const cleaned = response.text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
    const parsedResult: unknown = JSON.parse(cleaned);
    if (!isValidShape(parsedResult)) {
      return NextResponse.json({ success: false, message: "Analiz sonucu beklenmeyen bir formatta döndü." }, { status: 502 });
    }

    return NextResponse.json({ success: true, analysis: parsedResult });
  } catch {
    return NextResponse.json({ success: false, message: "Fotoğraf analiz edilirken bir sorun oluştu. Lütfen tekrar deneyin." }, { status: 502 });
  }
}
