import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { getSmtpTransport } from "@/lib/mail/get-smtp-transport";
import { buildEmailSignatureHtml } from "@/lib/mail/build-signature";
import { formatDate } from "@/components/crm/crm-format";

const CATEGORY_LABELS: Record<string, string> = {
  operational: "Operasyonel",
  compliance: "Uyumluluk",
  safety: "Güvenlik",
  financial: "Finansal",
  reputational: "İtibar",
};
const STATUS_LABELS: Record<string, string> = { open: "Açık", mitigating: "Önlem Alınıyor", closed: "Kapalı" };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** İlgili risk kaydının özetini, o kayda bağlı müşterinin e-posta adresine gönderir. Kuruma bağlı (müşterisiz/"Genel") kayıtlarda alıcı olmadığı için 400 döner. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const risk = await prisma.risk.findFirst({ where: { id, ownerId }, include: { customer: true } });
  if (!risk) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }
  if (!risk.customer || !risk.customer.contactEmail) {
    return NextResponse.json({ message: "Bu kayıt bir müşteriye bağlı değil veya müşterinin e-posta adresi yok." }, { status: 400 });
  }

  const resolved = await getSmtpTransport(ownerId);
  if (!resolved) {
    return NextResponse.json({ message: "SMTP entegrasyonu yapılandırılmamış." }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerId } });

  const bodyHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;">
    <p><strong>${escapeHtml(risk.title)}</strong></p>
    <table style="border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Müşteri</td><td>${escapeHtml(risk.customer.companyName)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Kategori</td><td>${escapeHtml(CATEGORY_LABELS[risk.category] ?? risk.category)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Durum</td><td>${escapeHtml(STATUS_LABELS[risk.status] ?? risk.status)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Skor</td><td>${risk.likelihood * risk.impact} (Olasılık ${risk.likelihood} × Etki ${risk.impact})</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Gözden Geçirme Tarihi</td><td>${escapeHtml(formatDate(risk.reviewDate))}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Sorumlu</td><td>${escapeHtml(risk.ownerName)}</td></tr>
    </table>
    <p style="margin-top:12px;"><strong>Açıklama:</strong><br />${escapeHtml(risk.description)}</p>
    <p><strong>Önlem / Aksiyon Planı:</strong><br />${escapeHtml(risk.mitigation)}</p>
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
      to: risk.customer.contactEmail,
      subject: `Risk Kaydı — ${risk.title}`,
      html: bodyHtml,
    });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "Mail gönderilemedi." }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
