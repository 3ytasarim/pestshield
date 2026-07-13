import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/tokens";

const RESET_TOKEN_TTL_MINUTES = 30;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Geçersiz e-posta" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Kullanıcı numaralandırma (enumeration) saldırılarını önlemek için
  // e-posta bulunamasa bile aynı jenerik yanıt döner.
  if (!user) {
    return NextResponse.json({
      message: "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
    });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // NOT: Bu projede henüz gerçek bir e-posta gönderim servisi (SMTP/Resend)
  // bağlanmadı. Geliştirme modunda linki loglayıp doğrudan yanıtta
  // döndürüyoruz ki akış uçtan uca test edilebilsin.
  console.log(`[forgot-password] Sıfırlama linki (${user.email}): ${resetLink}`);

  return NextResponse.json({
    message: "Eğer bu e-posta kayıtlıysa, sıfırlama bağlantısı gönderildi.",
    devResetLink: resetLink,
  });
}
