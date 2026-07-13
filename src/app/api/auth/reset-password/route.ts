import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  const body = await request.json();
  const { token, ...rest } = body as { token?: string };

  const parsed = resetPasswordSchema.safeParse(rest);
  if (!parsed.success || !token) {
    return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { message: "Bağlantının süresi dolmuş veya zaten kullanılmış" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message: "Şifreniz güncellendi" });
}
