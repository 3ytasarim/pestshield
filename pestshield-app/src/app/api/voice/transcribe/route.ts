import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";

// PestShield AI Command Center — Faz 4 sunucu tabanlı ses→metin uç noktası.
//
// GÜVENLİK/GİZLİLİK: Yüklenen ses dosyası hiçbir zaman diske yazılmaz —
// yalnızca bellekte (Buffer) tutulur, OpenAI'ye iletilir ve yanıt
// döndükten sonra referans bırakılmadan çöp toplanır. Kalıcı depolama
// YOKTUR (spesifikasyon: "Do not permanently store audio by default").
// Ham ses verisi loglanmaz — yalnızca sonuç metninin uzunluğu audit'e
// yazılır (bkz. ai-command-center.tsx'teki logAiToolCall benzeri çağrı).

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // ~10MB (60 saniyelik webm/opus için bolca yeterli)
const ALLOWED_TYPES = ["audio/webm", "audio/webm;codecs=opus", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"];

// Tek örnek içi, bellek-içi basit hız sınırlama — bu uygulamanın diğer tüm
// "audit log"/"proposal store" katmanları gibi tek-instance varsayımına
// sahiptir; gerçek üretimde bir Redis/DB tabanlı sınırlayıcı gerekir.
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });

  if (isRateLimited(session.user.id)) {
    return NextResponse.json({ message: "Çok fazla ses isteği gönderildi, lütfen biraz bekleyin." }, { status: 429 });
  }

  const apiKey = process.env.VOICE_STT_API_KEY || (process.env.AI_PROVIDER === "openai" ? process.env.AI_API_KEY : undefined);
  if (!apiKey) {
    return NextResponse.json({ message: "Sunucu tabanlı ses tanıma yapılandırılmamış." }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const audio = formData?.get("audio");
  const language = String(formData?.get("language") ?? process.env.VOICE_STT_LANGUAGE ?? "tr-TR");

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ message: "Ses dosyası bulunamadı." }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ message: "Boş ses kaydı." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ message: "Ses kaydı çok büyük (maksimum ~10MB)." }, { status: 413 });
  }
  if (audio.type && !ALLOWED_TYPES.some((t) => audio.type.startsWith(t.split(";")[0]))) {
    return NextResponse.json({ message: "Desteklenmeyen ses formatı." }, { status: 415 });
  }

  try {
    const client = new OpenAI({ apiKey, timeout: Number(process.env.VOICE_STT_TIMEOUT_MS || 20000) });
    const file = new File([await audio.arrayBuffer()], "recording.webm", { type: audio.type || "audio/webm" });
    const transcription = await client.audio.transcriptions.create({
      file,
      model: process.env.VOICE_STT_MODEL || "whisper-1",
      language: language.split("-")[0], // Whisper ISO-639-1 bekler ("tr"), "tr-TR" değil
    });
    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ses metne çevrilemedi.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
