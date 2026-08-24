import "server-only";
import nodemailer from "nodemailer";

export interface PlatformSmtpTransport {
  transporter: nodemailer.Transporter;
  fromName: string;
  fromEmail: string;
}

/** PestShield'ın kendi satış/bildirim e-postaları (ör. lisans kodu oluşturma) için PLATFORM
 * seviyesinde tek bir SMTP hesabı — kiracı başına DB'de tutulan `SmtpIntegration`'dan
 * (bkz. get-smtp-transport.ts) FARKLIDIR, o kiracıların KENDİ müşterilerine mail atması için.
 * Bu, sunucu `.env`'inde tanımlanır; yapılandırılmamışsa `null` döner ve çağıran yer
 * sessizce atlar (ana işlemi asla engellemez). Gerekli değişkenler: PLATFORM_SMTP_HOST,
 * PLATFORM_SMTP_PORT, PLATFORM_SMTP_FROM_EMAIL (+ opsiyonel PLATFORM_SMTP_USER/PASS,
 * PLATFORM_SMTP_ENCRYPTION="ssl"|"tls", PLATFORM_SMTP_FROM_NAME). */
export function getPlatformSmtpTransport(): PlatformSmtpTransport | null {
  const host = process.env.PLATFORM_SMTP_HOST;
  const port = process.env.PLATFORM_SMTP_PORT;
  const fromEmail = process.env.PLATFORM_SMTP_FROM_EMAIL;
  if (!host || !port || !fromEmail) return null;

  const user = process.env.PLATFORM_SMTP_USER;
  const pass = process.env.PLATFORM_SMTP_PASS;
  const encryption = process.env.PLATFORM_SMTP_ENCRYPTION;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: encryption === "ssl",
    requireTLS: encryption === "tls",
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 10_000,
  });

  return { transporter, fromName: process.env.PLATFORM_SMTP_FROM_NAME || "PestShield", fromEmail };
}
