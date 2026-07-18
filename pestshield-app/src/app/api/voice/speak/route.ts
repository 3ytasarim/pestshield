import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";

// PestShield AI Command Center — Faz 4 sunucu tabanlı metin→ses uç noktası.
// Yalnızca uygulama içi (trusted) metinleri seslendirir — LLM'in serbest
// çıktısı burada üretilmez, sadece zaten ekranda gösterilmiş bir özet
// metni buraya iletilir.

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 1200;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });

  const apiKey = process.env.VOICE_TTS_API_KEY || (process.env.AI_PROVIDER === "openai" ? process.env.AI_API_KEY : undefined);
  if (!apiKey) {
    return NextResponse.json({ message: "Sunucu tabanlı sesli yanıt yapılandırılmamış." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { text?: string; voice?: string } | null;
  const text = body?.text?.trim();
  if (!text) return NextResponse.json({ message: "Seslendirilecek metin bulunamadı." }, { status: 400 });
  if (text.length > MAX_TEXT_LENGTH) return NextResponse.json({ message: "Metin çok uzun." }, { status: 400 });

  try {
    const client = new OpenAI({ apiKey, timeout: Number(process.env.VOICE_TTS_TIMEOUT_MS || 20000) });
    const response = await client.audio.speech.create({
      model: process.env.VOICE_TTS_MODEL || "tts-1",
      voice: (body?.voice || process.env.VOICE_TTS_VOICE || "alloy") as OpenAI.Audio.Speech.SpeechCreateParams["voice"],
      input: text,
      speed: Number(process.env.VOICE_TTS_SPEED || 1),
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    return new NextResponse(buffer, { headers: { "Content-Type": "audio/mpeg", "Content-Length": String(buffer.byteLength) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sesli yanıt üretilemedi.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
