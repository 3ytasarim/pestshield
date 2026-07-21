import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { getSmtpTransport } from "@/lib/mail/get-smtp-transport";

// PestShield AI Command Center — Faz 3 genel amaçlı e-posta gönderim uç noktası.
//
// SMTP kimlik bilgileri artık kiracı başına DB'de şifreli saklanır (bkz.
// get-smtp-transport.ts) — istemciden asla alınmaz, sadece hedef/konu/gövde
// gelir. Bu route yalnızca oturum açmış bir CLIENT tarafından çağrılabilir;
// gövdedeki konu/metin LLM'in serbest çıktısı değil, trusted email-templates.ts
// tarafından üretilmiş, kullanıcının önizleyip onayladığı sabit metindir.

interface SendEmailRequest {
  toEmail: string;
  subject: string;
  body: string;
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const body = (await request.json()) as Partial<SendEmailRequest>;
  const { toEmail, subject, body: text } = body;

  if (!toEmail || !subject || !text) {
    return NextResponse.json({ message: "E-posta gönderimi için gerekli tüm alanlar zorunludur." }, { status: 400 });
  }

  const resolved = await getSmtpTransport(ownerId);
  if (!resolved) {
    return NextResponse.json({ message: "SMTP entegrasyonu henüz yapılandırılmadı." }, { status: 503 });
  }

  try {
    await resolved.transporter.sendMail({
      from: resolved.fromName ? `"${resolved.fromName}" <${resolved.fromEmail}>` : resolved.fromEmail,
      to: toEmail,
      subject,
      text,
    });

    return NextResponse.json({ message: "E-posta başarıyla gönderildi" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP bağlantısı kurulamadı";
    return NextResponse.json({ message }, { status: 502 });
  }
}
