import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { getAiModelProvider } from "@/lib/ai/providers/get-model-provider";
import { AiProviderNotConfiguredError } from "@/lib/ai/providers/model-provider";

export const runtime = "nodejs";

const MODEL = process.env.AI_MODEL || "claude-sonnet-4-5";
const MAX_TOKENS = 200;
const REQUEST_TIMEOUT = Number(process.env.AI_REQUEST_TIMEOUT_MS || process.env.AI_REQUEST_TIMEOUT || 20000);

// Gerçek zamanlı internet araması YAPMAZ — sadece modelin kendi eğitim
// verisindeki bilgiyi kullanır. Kullanıcı bunu bilerek onayladı (bkz. sohbet).
const SYSTEM_PROMPT = `Sen bir biyosidal/pestisit ürün bilgi asistanısın. Kullanıcı bir ürün adı verecek; SADECE o ürünün bilinen aktif madde bileşimini kısa, tek satırlık bir metin olarak döndür (ör: "Deltamethrin %25, Piperonil Bütoksit %5"). Gerçek zamanlı internet araması yapamazsın, sadece eğitim verindeki bilgiyi kullan. Ürünü tanımıyorsan veya emin değilsen SADECE "BİLİNMİYOR" yaz, asla uydurma bilgi verme. Başka hiçbir açıklama, markdown veya ek metin ekleme — sadece istenen tek satırı döndür.`;

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

  let modelProvider;
  try {
    modelProvider = getAiModelProvider();
  } catch (err) {
    if (err instanceof AiProviderNotConfiguredError) {
      return NextResponse.json({ message: "AI özelliği yapılandırılmadı." }, { status: 503 });
    }
    throw err;
  }

  try {
    const response = await modelProvider.createMessage({
      model: MODEL,
      maxTokens: MAX_TOKENS,
      timeoutMs: REQUEST_TIMEOUT,
      system: SYSTEM_PROMPT,
      tools: [],
      messages: [{ role: "user", content: `Ürün adı: ${productName}` }],
    });

    const text = response.text.trim();
    if (!text || text.toUpperCase().includes("BİLİNMİYOR")) {
      return NextResponse.json({ message: "Bu ürün için AI'nin bilgisi yok — lütfen elle girin." }, { status: 404 });
    }

    return NextResponse.json({ activeIngredient: text });
  } catch {
    return NextResponse.json({ message: "AI içerik oluşturulamadı, lütfen tekrar deneyin." }, { status: 500 });
  }
}
