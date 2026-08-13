import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { adminUpdateCompanySchema } from "@/lib/validations/auth";

const BCRYPT_ROUNDS = 12;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.user.findFirst({ where: { id, role: "CLIENT" } });
  if (!existing) {
    return NextResponse.json({ message: "Firma bulunamadı." }, { status: 404 });
  }

  const parsed = adminUpdateCompanySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { password, ...values } = parsed.data;
  if (values.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: values.email } });
    if (emailTaken) {
      return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
    }
  }

  const passwordHash = password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : undefined;
  const company = await prisma.user.update({
    where: { id },
    data: { ...values, ...(passwordHash ? { password: passwordHash } : {}) },
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

/** Firma silme, ownerId'ye bağlı tüm tenant verisini (Cascade) kalıcı olarak siler — geri alınamaz. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.user.findFirst({ where: { id, role: "CLIENT" } });
  if (!existing) {
    return NextResponse.json({ message: "Firma bulunamadı." }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
