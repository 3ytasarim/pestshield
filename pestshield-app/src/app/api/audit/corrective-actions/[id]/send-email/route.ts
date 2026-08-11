import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { getSmtpTransport } from "@/lib/mail/get-smtp-transport";
import { buildEmailSignatureHtml } from "@/lib/mail/build-signature";
import { formatDate } from "@/components/crm/crm-format";

const SEVERITY_LABELS: Record<string, string> = { low: "Düşük", medium: "Orta", high: "Yüksek", critical: "Kritik" };
const STATUS_LABELS: Record<string, string> = { open: "Açık", in_progress: "Devam Ediyor", resolved: "Çözüldü", verified: "Doğrulandı" };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** İlgili düzeltici/önleyici faaliyetin özetini, o kayda bağlı müşterinin e-posta adresine gönderir. Kuruma bağlı (müşterisiz) kayıtlarda alıcı olmadığı için 400 döner. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const capa = await prisma.correctiveAction.findFirst({ where: { id, ownerId }, include: { customer: true } });
  if (!capa) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }
  if (!capa.customer || !capa.customer.contactEmail) {
    return NextResponse.json({ message: "Bu kayıt bir müşteriye bağlı değil veya müşterinin e-posta adresi yok." }, { status: 400 });
  }

  const resolved = await getSmtpTransport(ownerId);
  if (!resolved) {
    return NextResponse.json({ message: "SMTP entegrasyonu yapılandırılmamış." }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });

  const bodyHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;">
    <p><strong>${escapeHtml(capa.title)}</strong></p>
    <table style="border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Müşteri</td><td>${escapeHtml(capa.customer.companyName)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Önem Derecesi</td><td>${escapeHtml(SEVERITY_LABELS[capa.severity] ?? capa.severity)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Durum</td><td>${escapeHtml(STATUS_LABELS[capa.status] ?? capa.status)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Vade Tarihi</td><td>${escapeHtml(formatDate(capa.dueDate))}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Sorumlu</td><td>${escapeHtml(capa.responsible)}</td></tr>
    </table>
    <p style="margin-top:12px;"><strong>Kök Neden:</strong><br />${escapeHtml(capa.rootCause)}</p>
    <p><strong>Aksiyon Planı:</strong><br />${escapeHtml(capa.actionPlan)}</p>
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

  try {
    await resolved.transporter.sendMail({
      from: resolved.fromName ? `"${resolved.fromName}" <${resolved.fromEmail}>` : resolved.fromEmail,
      to: capa.customer.contactEmail,
      subject: `Düzeltici Önleyici Faaliyet — ${capa.title}`,
      html: bodyHtml,
    });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Mail gönderilemedi." }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
