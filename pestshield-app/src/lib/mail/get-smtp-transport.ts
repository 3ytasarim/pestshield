import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

export interface ResolvedSmtpTransport {
  transporter: nodemailer.Transporter;
  fromName: string | null;
  fromEmail: string;
}

/** Kiracı başına DB'de şifreli saklanan SMTP ayarlarından bir nodemailer transporter kurar; yapılandırılmamışsa `null` döner. */
export async function getSmtpTransport(ownerId: string): Promise<ResolvedSmtpTransport | null> {
  const integration = await prisma.smtpIntegration.findUnique({ where: { ownerId } });
  if (!integration) return null;

  const transporter = nodemailer.createTransport({
    host: integration.host,
    port: integration.port,
    secure: integration.encryption === "ssl",
    requireTLS: integration.encryption === "tls",
    ...(integration.username && integration.passwordEnc
      ? { auth: { user: integration.username, pass: decryptSecret(integration.passwordEnc) } }
      : {}),
    connectionTimeout: 10_000,
  });

  return { transporter, fromName: integration.fromName, fromEmail: integration.fromEmail };
}
