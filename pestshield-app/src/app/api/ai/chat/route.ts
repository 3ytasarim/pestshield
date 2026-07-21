// PestShield AI Command Center — sohbet uç noktası.
//
// Mimari not: CRM/servis/periyot/tahsilat/risk verisi bu uygulamada gerçek
// bir veritabanında değil, tarayıcı localStorage'ında tutuluyor (bkz.
// src/lib/ai/providers/data-provider.ts). Bu route bu yüzden veriyi kendisi
// sorgulamıyor — Claude'a sadece tool ŞEMALARINI sunuyor, model hangi
// tool'u hangi parametrelerle çağıracağına karar veriyor, gerçek çalıştırma
// tarayıcıda (src/lib/ai/tools/executor.ts, AiDataProvider üzerinden)
// yapılıyor ve sonuç bu route'a geri POST edilerek konuşma devam
// ettiriliyor. Model hiçbir zaman API anahtarını, ham storage erişimini
// veya tanımlı olmayan bir tool'u görmüyor/çağıramıyor.
//
// FAZ 1 KESİNLİKLE SALT OKUNURDUR — toolsForRole()'un döndürdüğü listede
// hiçbir yazma/güncelleme/silme/atama/gönderme tool'u yoktur.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toolsForRole } from "@/lib/ai/tools";
import { getAiModelProvider } from "@/lib/ai/providers/get-model-provider";
import { AiProviderNotConfiguredError } from "@/lib/ai/providers/model-provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

export const runtime = "nodejs";

const MODEL = process.env.AI_MODEL || "claude-sonnet-4-5";
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 1024);
const REQUEST_TIMEOUT = Number(process.env.AI_REQUEST_TIMEOUT_MS || process.env.AI_REQUEST_TIMEOUT || 20000);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
  }
  if (session.user.role === "CUSTOMER") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  let body: { messages?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ message: "Mesaj bulunamadı." }, { status: 400 });
  }
  if (messages.length > 60) {
    return NextResponse.json({ message: "Konuşma çok uzun, lütfen yeni bir sohbet başlatın." }, { status: 400 });
  }

  const role = session.user.role;
  const tools = toolsForRole(role).map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema }));

  let modelProvider;
  try {
    modelProvider = getAiModelProvider();
  } catch (error) {
    if (error instanceof AiProviderNotConfiguredError) {
      return NextResponse.json({ message: error.message }, { status: 503 });
    }
    throw error;
  }

  // Sistem promptuna deterministik tarih ipucu eklemek için en son kullanıcı mesajını bul.
  const lastMessage = messages[messages.length - 1] as { role?: string; content?: unknown };
  const lastUserText = lastMessage?.role === "user" && typeof lastMessage.content === "string" ? lastMessage.content : null;

  let response;
  try {
    response = await modelProvider.createMessage({
      model: MODEL,
      maxTokens: MAX_TOKENS,
      timeoutMs: REQUEST_TIMEOUT,
      system: buildSystemPrompt(session.user.name ?? "Kullanıcı", role, lastUserText),
      tools,
      messages,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ message: `AI servisi şu anda yanıt veremiyor: ${detail}` }, { status: 502 });
  }

  if (response.type === "tool_use") {
    // TECH rolündeki kullanıcılar teknisyen programı sorgusunda sadece kendi adlarını sorgulayabilir —
    // model başka bir isim seçse bile burada, sunucu tarafında zorlanır.
    const calls = response.toolCalls.map((call) => {
      const input = { ...call.input };
      if (role === "TECH" && call.name === "get_technician_schedule") {
        input.technicianName = session.user.name ?? input.technicianName;
      }
      return { id: call.id, name: call.name, input };
    });

    return NextResponse.json({
      type: "tool_use",
      assistantMessage: { role: "assistant" as const, content: response.rawAssistantContent },
      calls,
    });
  }

  return NextResponse.json({
    type: "final",
    assistantMessage: { role: "assistant" as const, content: response.rawAssistantContent },
    text: response.text,
  });
}
