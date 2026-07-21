import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations/auth";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.actingUserId } });
  if (!user?.password) {
    return NextResponse.json(
      { message: "Bu hesap için şifre değişikliği desteklenmiyor." },
      { status: 400 },
    );
  }

  const currentMatches = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!currentMatches) {
    return NextResponse.json({ message: "Mevcut şifre hatalı." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  return NextResponse.json({ message: "Şifreniz güncellendi." });
}
