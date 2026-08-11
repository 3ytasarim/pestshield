import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { getSmtpTransport } from "@/lib/mail/get-smtp-transport";
import { buildEmailSignatureHtml, buildEmailSignatureText } from "@/lib/mail/build-signature";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

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

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  const companyName = owner?.companyName || resolved.fromName || "Firmanız";

  const signatureInfo = owner
    ? {
        name: owner.name,
        title: resolved.signatureTitle,
        companyName: owner.companyName,
        logoUrl: owner.logoUrl,
        phone: owner.phone,
        address: [owner.address, owner.district, owner.city].filter(Boolean).join(", ") || null,
      }
    : null;
  const signatureHtml = resolved.signatureEnabled && signatureInfo ? buildEmailSignatureHtml(signatureInfo) : "";
  const signatureText = resolved.signatureEnabled && signatureInfo ? buildEmailSignatureText(signatureInfo) : "";

  try {
    await resolved.transporter.sendMail({
      from: resolved.fromName ? `"${resolved.fromName}" <${resolved.fromEmail}>` : resolved.fromEmail,
      to: body.toEmail,
      subject: `${companyName} — Test E-postası`,
      text: `Bu, ${companyName} Entegrasyonlar sayfasından gönderilen bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor.${signatureText ? `\n\n${signatureText}` : ""}`,
      html: `<p>Bu, <b>${escapeHtml(companyName)}</b> Entegrasyonlar sayfasından gönderilen bir test e-postasıdır.</p><p>SMTP ayarlarınız doğru çalışıyor.</p>${signatureHtml}`,
    });
    return NextResponse.json({ message: "Test e-postası başarıyla gönderildi" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP bağlantısı kurulamadı";
    return NextResponse.json({ message }, { status: 502 });
  }
}
