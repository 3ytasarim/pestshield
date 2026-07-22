import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireClientOwner } from "@/lib/api-auth";

export const runtime = "nodejs";

const MODEL = process.env.AI_MODEL || "gpt-4o";
// Web araması eklenince yanıt süresi düz bir tamamlamadan daha uzun sürebilir.
const REQUEST_TIMEOUT = Number(process.env.AI_REQUEST_TIMEOUT_MS || process.env.AI_REQUEST_TIMEOUT || 30000);

function buildPrompt(productName: string): string {
  return `"${productName}" adlı biyosidal/pestisit ürününü web'de araştır ve SADECE aktif madde bileşimini kısa, tek satırlık bir metin olarak döndür (ör: "Deltamethrin %25, Piperonil Bütoksit %5"). Başka hiçbir açıklama, kaynak linki, madde işareti veya ek metin ekleme — sadece istenen tek satırı döndür. Ürünü bulamazsan veya emin olamazsan SADECE "BİLİNMİYOR" yaz, asla uydurma bilgi verme.`;
}

/** Modelin bazen satır sonuna eklediği kaynak/dipnot işaretlerini (【1†...】, [1] vb.) temizler. */
function stripCitationArtifacts(text: string): string {
  return text
    .replace(/【[^】]*】/g, "")
    .replace(/\[\d+\]/g, "")
    .trim();
}

export async function POST(request: Request) {
  const { error } = await requireClientOwner();
  if (error) return error;

  let body: { productName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const productName = body.productName?.trim();
  if (!productName || productName.length < 2) {
    return NextResponse.json({ message: "Ürün adı gerekli." }, { status: 400 });
  }

  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || provider !== "openai") {
    return NextResponse.json(
      { message: "Bu özellik gerçek web araması için OpenAI tabanlı bir yapılandırma (AI_PROVIDER=openai) gerektiriyor." },
      { status: 503 },
    );
  }

  const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT });

  try {
    const response = await client.responses.create({
      model: MODEL,
      input: buildPrompt(productName),
      tools: [{ type: "web_search" }],
    });

    const text = stripCitationArtifacts(response.output_text ?? "");
    if (!text || text.toUpperCase().includes("BİLİNMİYOR")) {
      return NextResponse.json({ message: "Bu ürün için AI'nin bilgisi yok — lütfen elle girin." }, { status: 404 });
    }

    return NextResponse.json({ activeIngredient: text });
  } catch {
    return NextResponse.json({ message: "AI içerik oluşturulamadı, lütfen tekrar deneyin." }, { status: 500 });
  }
}
