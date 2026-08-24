import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LICENSE_PRESETS } from "@/lib/license";
import { generateLicenseCode } from "@/lib/license-codegen";
import { getPlatformSmtpTransport } from "@/lib/mail/get-platform-smtp-transport";
import { buildEmailSignatureHtml } from "@/lib/mail/build-signature";
import { isMultiTenant } from "@/lib/tenant";

const TYPE_LABEL: Record<"DEMO" | "MONTHLY" | "YEARLY", string> = {
  DEMO: "5 Günlük Demo",
  MONTHLY: "Aylık",
  YEARLY: "Yıllık",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Yeni oluşturulan lisans kodunu, firmanın kayıt formundaki ilgili kişisine PestShield'ın
 * kendi (satış) adresinden bildirir. SMTP yapılandırılmamışsa veya gönderim başarısız olursa
 * sessizce atlar — lisans kodu oluşturma işlemini asla engellemez. */
async function sendLicenseCreatedEmail(params: {
  targetName: string | null;
  targetCompanyName: string | null;
  targetEmail: string;
  code: string;
  type: "DEMO" | "MONTHLY" | "YEARLY";
  durationDays: number;
}) {
  if (!isMultiTenant()) return;

  const resolved = getPlatformSmtpTransport();
  if (!resolved) return;

  const baseUrl = process.env.NEXTAUTH_URL || "https://pestshield.app";
  const logoUrl = `${baseUrl}/email/pestshield-logo.png`;
  const licensePageUrl = `${baseUrl}/dashboard/client/license`;
  const greetingName = params.targetName || params.targetCompanyName || "Yetkili";
  const typeLabel = TYPE_LABEL[params.type];

  const bodyHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;">
    <img src="${logoUrl}" alt="PestShield" style="height:36px;display:block;margin-bottom:20px;" />
    <p>Merhaba ${escapeHtml(greetingName)},</p>
    <p>${escapeHtml(params.targetCompanyName ?? "Firmanız")} için PestShield üzerinde bir lisans tanımlaması yapıldı. <strong>${typeLabel}</strong> lisansınız ile ${params.durationDays} gün boyunca sınırsız kullanım sağlayabilirsiniz.</p>
    <table style="border-collapse:collapse;font-size:13px;margin:16px 0;">
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Lisans Kodu</td><td style="font-family:monospace;font-weight:700;">${escapeHtml(params.code)}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Lisans Türü</td><td>${typeLabel}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#64748b;">Süre</td><td>${params.durationDays} gün</td></tr>
    </table>
    <p>Kodu kullanmak için <a href="${licensePageUrl}" style="color:#16a34a;">Lisans sayfasına</a> gidip yukarıdaki kodu girmeniz yeterli.</p>
    <p>Herhangi bir sorunuz olursa bu e-postayı yanıtlayabilirsiniz.</p>
  </div>${buildEmailSignatureHtml({
    name: "PestShield Satış Ekibi",
    title: null,
    companyName: "PestShield",
    logoUrl: null,
    phone: null,
    address: null,
  })}`;

  try {
    await resolved.transporter.sendMail({
      from: `"${resolved.fromName}" <${resolved.fromEmail}>`,
      to: params.targetEmail,
      subject: `PestShield Lisansınız Tanımlandı — ${typeLabel}`,
      html: bodyHtml,
    });
  } catch (err) {
    console.error("[license-codes] Lisans bildirim e-postası gönderilemedi:", err);
  }
}

const bodySchema = z.object({
  targetUserId: z.string().uuid(),
  type: z.enum(["DEMO", "MONTHLY", "YEARLY"]),
  durationDays: z.number().int().min(1).max(3650).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { id: parsed.data.targetUserId } });
  if (!targetUser || targetUser.role !== "CLIENT") {
    return NextResponse.json({ message: "Firma bulunamadı." }, { status: 404 });
  }

  const preset = LICENSE_PRESETS.find((p) => p.type === parsed.data.type);
  const durationDays = parsed.data.durationDays ?? preset?.durationDays ?? 30;

  let code = generateLicenseCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.licenseCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateLicenseCode();
  }

  const licenseCode = await prisma.licenseCode.create({
    data: {
      code,
      type: parsed.data.type,
      durationDays,
      targetUserId: targetUser.id,
      createdByUserId: session.user.id,
    },
  });

  if (targetUser.email) {
    void sendLicenseCreatedEmail({
      targetName: targetUser.name,
      targetCompanyName: targetUser.companyName,
      targetEmail: targetUser.email,
      code: licenseCode.code,
      type: parsed.data.type,
      durationDays,
    });
  }

  return NextResponse.json({ licenseCode });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const codes = await prisma.licenseCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      targetUser: { select: { companyName: true, name: true, email: true } },
      redeemedBy: { select: { companyName: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ codes });
}
