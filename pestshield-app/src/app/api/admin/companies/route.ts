import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { adminCreateCompanySchema } from "@/lib/validations/auth";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = adminCreateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const company = await prisma.user.create({
    data: {
      role: "CLIENT",
      email: parsed.data.email,
      password: passwordHash,
      companyName: parsed.data.companyName,
      address: parsed.data.address,
      phone: parsed.data.phone,
      logoUrl: parsed.data.logoUrl,
    },
  });

  return NextResponse.json({
    company: {
      id: company.id,
      companyName: company.companyName,
      email: company.email,
      address: company.address,
      phone: company.phone,
      logoUrl: company.logoUrl,
      licenseType: company.licenseType,
      licenseExpiresAt: company.licenseExpiresAt,
      createdAt: company.createdAt,
      isActive: company.isActive,
    },
  });
}
