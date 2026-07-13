import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { technicianFormSchema } from "@/lib/validations/operations";

const BCRYPT_ROUNDS = 12;

/** Yeni bir teknisyen eklendiğinde onun için gerçek bir giriş hesabı (rol: TECH) oluşturur. */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = technicianFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: "TECH",
    },
  });

  return NextResponse.json({ message: "Teknisyen hesabı oluşturuldu" }, { status: 201 });
}
