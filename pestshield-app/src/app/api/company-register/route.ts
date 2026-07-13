import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { companyRegisterSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/tokens";

const BCRYPT_ROUNDS = 12;
const VERIFICATION_TOKEN_TTL_HOURS = 24;
const DEMO_LICENSE_DAYS = 5;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = companyRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { companyName, fullName, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const verificationToken = generateToken();
  const tokenExpiresAt = new Date(
    Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  );
  const licenseExpiresAt = new Date(
    Date.now() + DEMO_LICENSE_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.$transaction([
    prisma.user.create({
      data: {
        name: fullName,
        email,
        password: passwordHash,
        role: "CLIENT",
        companyName,
        licenseType: "DEMO",
        licenseExpiresAt,
      },
    }),
    prisma.verificationToken.create({
      data: { identifier: email, token: verificationToken, expires: tokenExpiresAt },
    }),
  ]);

  const verifyLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;

  // NOT: gerçek e-posta gönderimi henüz bağlanmadı (bkz. forgot-password route).
  console.log(`[company-register] Doğrulama linki (${email}): ${verifyLink}`);

  return NextResponse.json({
    message: "Firma hesabınız 5 günlük demo lisansıyla oluşturuldu",
    devVerifyLink: verifyLink,
  });
}
