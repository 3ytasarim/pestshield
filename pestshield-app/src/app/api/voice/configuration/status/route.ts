import { NextResponse } from "next/server";
import { auth } from "@/auth";

// PestShield AI Command Center — Faz 4 ses sağlayıcı yapılandırma durumu.
// Hiçbir sır döndürmez — sadece hangi modun (browser/openai) kullanılabilir
// olduğunu bildirir. WhatsApp'taki /api/whatsapp/configuration/status ile
// aynı desen (bkz. o dosyanın yorumu).

function resolveKey(specific: string | undefined): string | undefined {
  // VOICE_STT_API_KEY/VOICE_TTS_API_KEY ayrıca tanımlanmamışsa, AI_PROVIDER
  // zaten "openai" ise mevcut AI_API_KEY'i yeniden kullanır — kullanıcının
  // aynı anahtarı üç kez girmesi gerekmez.
  if (specific) return specific;
  if (process.env.AI_PROVIDER === "openai") return process.env.AI_API_KEY;
  return undefined;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });

  const sttConfigured = Boolean(resolveKey(process.env.VOICE_STT_API_KEY) && (process.env.VOICE_STT_PROVIDER ?? "openai") === "openai");
  const ttsConfigured = Boolean(resolveKey(process.env.VOICE_TTS_API_KEY) && (process.env.VOICE_TTS_PROVIDER ?? "openai") === "openai");

  return NextResponse.json({
    stt: { openaiAvailable: sttConfigured, browserAlwaysAvailable: true },
    tts: { openaiAvailable: ttsConfigured, browserAlwaysAvailable: true },
  });
}
