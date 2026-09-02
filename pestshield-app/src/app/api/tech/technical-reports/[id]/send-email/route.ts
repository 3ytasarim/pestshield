import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";
import { getSmtpTransport } from "@/lib/mail/get-smtp-transport";
import { buildEmailSignatureHtml } from "@/lib/mail/build-signature";
import { formatDate } from "@/components/crm/crm-format";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** İlgili teknik rapor kaydını, bağlı olduğu müşterinin e-posta adresine belge eki ile birlikte gönderir. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;
  const { id } = await params;

  const report = await prisma.technicalReport.findFirst({
    where: { id, ownerId, technicianId },
    include: { customer: true },
  });
  if (!report) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }
  if (!report.customer.contactEmail) {
    return NextResponse.json({ message: "Bu müşterinin e-posta adresi tanımlı değil." }, { status: 400 });
  }

  const resolved = await getSmtpTransport(ownerId);
  if (!resolved) {
    return NextResponse.json({ message: "SMTP entegrasyonu yapılandırılmamış." }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });

  const bodyHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;">
    <p><strong>${escapeHtml(report.documentName)}</strong></p>
    <table style="border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Müşteri</td><td>${escapeHtml(report.customer.companyName)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Rapor Tarihi</td><td>${escapeHtml(formatDate(report.reportDate))}</td></tr>
    </table>
    <p style="margin-top:12px;"><strong>Açıklama:</strong><br />${report.description}</p>
  </div>${
    resolved.signatureEnabled && owner
      ? buildEmailSignatureHtml({
          name: owner.name,
          title: resolved.signatureTitle,
          companyName: owner.companyName,
          logoUrl: owner.logoUrl,
          phone: owner.phone,
          address: [owner.address, owner.district, owner.city].filter(Boolean).join(", ") || null,
        })
      : ""
  }`;

  const match = /^data:(.+?);base64,(.+)$/.exec(report.fileDataUrl);
  const attachments = match
    ? [{ filename: report.fileName || report.documentName, content: Buffer.from(match[2], "base64"), contentType: match[1] }]
    : [];

  try {
    await resolved.transporter.sendMail({
      from: resolved.fromName ? `"${resolved.fromName}" <${resolved.fromEmail}>` : resolved.fromEmail,
      to: report.customer.contactEmail,
      subject: `Teknik Rapor — ${report.documentName}`,
      html: bodyHtml,
      attachments,
    });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Mail gönderilemedi." }, { status: 502 });
  }

  const updated = await prisma.technicalReport.update({
    where: { id },
    data: { emailSentAt: new Date() },
    include: { customer: { select: { id: true, companyName: true } } },
  });

  return NextResponse.json({ report: updated });
}
