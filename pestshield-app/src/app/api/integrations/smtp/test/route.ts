import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { getSmtpTransport } from "@/lib/mail/get-smtp-transport";

/** Kaydedilmiş (DB'deki, şifreli) SMTP ayarlarıyla gerçek bir test e-postası gönderir — şifre istemciden asla tekrar istenmez. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as { toEmail?: string } | null;
  if (!body?.toEmail) {
    return NextResponse.json({ message: "Alıcı e-posta adresi zorunludur" }, { status: 400 });
  }

  const resolved = await getSmtpTransport(ownerId);
  if (!resolved) {
    return NextResponse.json({ message: "SMTP entegrasyonu henüz yapılandırılmadı." }, { status: 503 });
  }

  try {
    await resolved.transporter.sendMail({
      from: resolved.fromName ? `"${resolved.fromName}" <${resolved.fromEmail}>` : resolved.fromEmail,
      to: body.toEmail,
      subject: "PestShield AI — Test E-postası",
      text: "Bu, PestShield AI Entegrasyonlar sayfasından gönderilen bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor.",
      html: "<p>Bu, <b>PestShield AI</b> Entegrasyonlar sayfasından gönderilen bir test e-postasıdır.</p><p>SMTP ayarlarınız doğru çalışıyor.</p>",
    });
    return NextResponse.json({ message: "Test e-postası başarıyla gönderildi" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP bağlantısı kurulamadı";
    return NextResponse.json({ message }, { status: 502 });
  }
}
