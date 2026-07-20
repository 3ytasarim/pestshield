import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface TestMailRequest {
  host: string;
  port: string;
  requiresAuth: boolean;
  username: string;
  password: string;
  encryption: "none" | "ssl" | "tls";
  fromName: string;
  fromEmail: string;
  toEmail: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TestMailRequest>;
  const { host, port, requiresAuth = true, username, password, encryption, fromName, fromEmail, toEmail } = body;

  if (!host || !port || (requiresAuth && (!username || !password)) || !fromEmail || !toEmail) {
    return NextResponse.json({ message: "SMTP bilgileri ve alıcı e-posta adresi zorunludur" }, { status: 400 });
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
      subject: "PestShield AI — Test E-postası",
      text: "Bu, PestShield AI Entegrasyonlar sayfasından gönderilen bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor.",
      html: "<p>Bu, <b>PestShield AI</b> Entegrasyonlar sayfasından gönderilen bir test e-postasıdır.</p><p>SMTP ayarlarınız doğru çalışıyor.</p>",
    });

    return NextResponse.json({ message: "Test e-postası başarıyla gönderildi" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP bağlantısı kurulamadı";
    return NextResponse.json({ message }, { status: 502 });
  }
}
