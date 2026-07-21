import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { portalAccessFormSchema } from "@/lib/validations/crm";

const BCRYPT_ROUNDS = 12;

/** Bir müşteriye kendi portalına giriş yapabileceği gerçek bir hesap (rol: CUSTOMER) verir — Technician POST deseninin aynısı. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.customer.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }
  if (existing.userId) {
    return NextResponse.json({ message: "Bu müşterinin zaten portal erişimi var." }, { status: 409 });
  }

  const parsed = portalAccessFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: existing.contactName || existing.companyName, email, password: passwordHash, role: "CUSTOMER" },
      select: { id: true },
    });
    await tx.customer.update({ where: { id }, data: { userId: user.id } });
  });

  return NextResponse.json({ message: "Müşteri portalı erişimi verildi." }, { status: 201 });
}

/** Portal erişimini kaldırır — bağlı User hesabı da tamamen silinir (CompanyUser DELETE deseniyle aynı). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.customer.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }
  if (!existing.userId) {
    return NextResponse.json({ message: "Bu müşterinin portal erişimi yok." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({ where: { id }, data: { userId: null } });
    await tx.user.delete({ where: { id: existing.userId! }, select: { id: true } });
  });

  return NextResponse.json({ message: "Portal erişimi kaldırıldı." });
}
