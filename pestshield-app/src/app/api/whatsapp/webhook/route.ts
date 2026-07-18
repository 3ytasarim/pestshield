import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

// PestShield AI Command Center — Faz 4 WhatsApp webhook uç noktası (Meta).
//
// GÜVENLİK (spesifikasyon kural 36):
// - GET: Meta'nın doğrulama challenge'ını doğrular (hub.verify_token eşleşmeli).
// - POST: X-Hub-Signature-256 imzası WHATSAPP_APP_SECRET ile doğrulanır;
//   eşleşmezse istek REDDEDİLİR. tenantId asla webhook payload'ından
//   GÜVENİLMEZ (bu uygulamada tek-tenant/tarayıcı-başına mimari zaten
//   geçerli — bkz. data-provider.ts'deki aynı not).
// - Aynı provider event ID'si TEKRAR işlenmez (bellek-içi basit dedup —
//   diğer tüm bu dosyadaki hız sınırlayıcılar gibi tek-instance sınırlaması
//   vardır, gerçek üretimde kalıcı bir depoya taşınmalıdır).

export const runtime = "nodejs";

const processedEventIds = new Set<string>();
const MAX_TRACKED_EVENTS = 500;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ message: "Doğrulama başarısız." }, { status: 403 });
}

function verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export async function POST(request: Request) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const rawBody = await request.text();

  if (!appSecret) {
    // Sır yapılandırılmamışsa imza doğrulanamaz — istek reddedilir (sessizce kabul edilmez).
    return NextResponse.json({ message: "Webhook yapılandırılmamış." }, { status: 503 });
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (!verifySignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ message: "Geçersiz imza." }, { status: 401 });
  }

  let payload: { entry?: { id?: string; changes?: { value?: { statuses?: { id?: string }[] } }[] }[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Geçersiz payload." }, { status: 400 });
  }

  // Bilinmeyen olay şekillerini güvenle yok say — asla throw etmez.
  const statuses = payload.entry?.flatMap((e) => e.changes?.flatMap((c) => c.value?.statuses ?? []) ?? []) ?? [];
  for (const status of statuses) {
    if (!status.id) continue;
    if (processedEventIds.has(status.id)) continue; // yinelenen olay — tekrar işlenmez
    processedEventIds.add(status.id);
    if (processedEventIds.size > MAX_TRACKED_EVENTS) {
      const first = processedEventIds.values().next().value;
      if (first) processedEventIds.delete(first);
    }
    // Gerçek teslimat durumu güncellemesi (delivered/read/failed) burada
    // whatsapp/message-store.ts'e yazılabilir — bu depo yalnızca tarayıcı
    // localStorage'ında tutulduğundan (bu uygulamanın mimari sınırlaması,
    // bkz. data-provider.ts), sunucu tarafı webhook'un doğrudan yazabileceği
    // kalıcı bir hedefi yok. Bu, gerçek bir backend eklenene kadar bilinen
    // bir sınırlamadır (bkz. final rapor).
  }

  return NextResponse.json({ received: true });
}
