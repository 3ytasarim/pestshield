import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/auth";

// PestShield AI Command Center — Faz 3 genel amaçlı e-posta gönderim uç noktası.
//
// /api/integrations/test-mail/route.ts ile AYNI nodemailer bağlantı deseni
// (bkz. o dosyanın yorumu) — tek fark, sabit test konusu/gövdesi yerine
// executors.ts'nin (kullanıcı onayından SONRA) gönderdiği gerçek konu/gövde
// kabul edilmesidir. SMTP kimlik bilgileri istemciden gelir çünkü bu
// uygulamada SMTP ayarları sunucu değil, tarayıcı localStorage'ında tutulur
// (bkz. smtp-mail.ts) — bu, mevcut mimarinin bilinen bir sınırlamasıdır.
//
// Bu route yalnızca oturum açmış bir kullanıcı tarafından çağrılabilir;
// gövdedeki konu/metin LLM'in serbest çıktısı değil, trusted email-templates.ts
// tarafından üretilmiş, kullanıcının önizleyip onayladığı sabit metindir.

interface SendEmailRequest {
  host: string;
  port: string;
  requiresAuth: boolean;
  username: string;
  password: string;
  encryption: "none" | "ssl" | "tls";
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SendEmailRequest>;
  const { host, port, requiresAuth = true, username, password, encryption, fromName, fromEmail, toEmail, subject, body: text } = body;

  if (!host || !port || (requiresAuth && (!username || !password)) || !fromEmail || !toEmail || !subject || !text) {
    return NextResponse.json({ message: "E-posta gönderimi için gerekli tüm alanlar zorunludur." }, { status: 400 });
  }

  const portNumber = Number(port);
  if (!Number.isFinite(portNumber)) {
    return NextResponse.json({ message: "Geçersiz port numarası" }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: portNumber,
      secure: encryption === "ssl",
      requireTLS: encryption === "tls",
      ...(requiresAuth ? { auth: { user: username, pass: password } } : {}),
      connectionTimeout: 10_000,
    });

    await transporter.verify();
    await transporter.sendMail({
      from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
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
