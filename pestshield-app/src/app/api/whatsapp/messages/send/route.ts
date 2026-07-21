import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { getWhatsAppProvider } from "@/lib/whatsapp/get-whatsapp-provider";

// PestShield AI Command Center — Faz 4 WhatsApp gönderim uç noktası.
//
// Bu route SADECE executors.ts'nin (kullanıcının panelde "Onayla ve Gönder"
// butonuna tıklamasından SONRA) çağırdığı tek gerçek gönderim noktasıdır.
// Provider token'ı burada, sunucu tarafında kalır — istemciye asla gönderilmez.
// Sağlayıcı yapılandırılmamışsa DÜRÜSTÇE 503 döner, asla "gönderildi" simüle
// etmez (spesifikasyon kural 47: "Do not simulate delivery success").

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as { to?: string; templateName?: string; languageCode?: string; bodyVariables?: string[] } | null;
  if (!body?.to || !body.templateName) {
    return NextResponse.json({ message: "Alıcı numarası ve şablon adı zorunludur." }, { status: 400 });
  }

  const provider = await getWhatsAppProvider(ownerId);
  if (!provider.isConfigured) {
    return NextResponse.json({ message: "WhatsApp entegrasyonu henüz yapılandırılmadı." }, { status: 503 });
  }

  const result = await provider.sendTemplateMessage({
    to: body.to,
    templateName: body.templateName,
    languageCode: body.languageCode ?? "tr",
    bodyVariables: body.bodyVariables ?? [],
  });

  if (!result.success) {
    return NextResponse.json({ message: result.errorMessage ?? "WhatsApp mesajı gönderilemedi.", errorCode: result.errorCode }, { status: 502 });
  }

  return NextResponse.json({ providerMessageId: result.providerMessageId });
}
