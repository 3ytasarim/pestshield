import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { smtpConnectSchema } from "@/lib/validations/integrations";
import { encryptSecret, isSecretsEncryptionConfigured } from "@/lib/crypto";

/** SMTP bilgilerini gerçek bir bağlantıyla doğrular ve şifreli olarak DB'ye kaydeder. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  if (!isSecretsEncryptionConfigured()) {
    return NextResponse.json(
      { message: "Sır şifreleme yapılandırılmadı (SECRETS_ENCRYPTION_KEY eksik) — SMTP entegrasyonu kullanılamaz." },
      { status: 500 },
    );
  }

  const parsed = smtpConnectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { host, port, encryption, username, password, fromName, fromEmail } = parsed.data;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: encryption === "ssl",
      requireTLS: encryption === "tls",
      ...(username && password ? { auth: { user: username, pass: password } } : {}),
      connectionTimeout: 10_000,
    });
    await transporter.verify();
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP bağlantısı kurulamadı";
    return NextResponse.json({ message }, { status: 502 });
  }

  await prisma.smtpIntegration.upsert({
    where: { ownerId },
    create: {
      ownerId,
      host,
      port,
      encryption,
      username: username || null,
      passwordEnc: password ? encryptSecret(password) : null,
      fromName: fromName || null,
      fromEmail,
      connectedAt: new Date(),
    },
    update: {
      host,
      port,
      encryption,
      username: username || null,
      passwordEnc: password ? encryptSecret(password) : null,
      fromName: fromName || null,
      fromEmail,
      connectedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ connected: true });
}
