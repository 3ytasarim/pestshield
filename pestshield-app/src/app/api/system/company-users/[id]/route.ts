import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireClientOwner, getSessionPermissions } from "@/lib/api-auth";
import { companyUserUpdateSchema } from "@/lib/validations/system";
import { serializeCompanyUser } from "@/lib/system/serialize";

const BCRYPT_ROUNDS = 12;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const sessionPermissions = await getSessionPermissions();
  if (!sessionPermissions?.can("/dashboard/client/users", "edit")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const existing = await prisma.companyUser.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const parsed = companyUserUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }
  const { name, email, roleId, password, isActive } = parsed.data;

  const role = await prisma.companyRole.findFirst({ where: { id: roleId, ownerId } });
  if (!role) {
    return NextResponse.json({ message: "Geçersiz rol." }, { status: 400 });
  }

  const passwordHash = password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : undefined;

  const companyUser = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.userId },
      data: {
        name,
        email,
        isActive,
        ...(passwordHash ? { password: passwordHash } : {}),
      },
      select: { id: true },
    });
    return tx.companyUser.update({
      where: { id },
      data: { name, email, roleId },
      include: { role: true, user: { select: { isActive: true } } },
    });
  });

  return NextResponse.json({ companyUser: serializeCompanyUser(companyUser) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const sessionPermissions = await getSessionPermissions();
  if (!sessionPermissions?.can("/dashboard/client/users", "delete")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const existing = await prisma.companyUser.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  // CompanyUser onDelete:Cascade User'a bağlı değil (ters yönde) - User'ı da açıkça sil ki giriş tamamen kapansın.
  await prisma.$transaction(async (tx) => {
    await tx.companyUser.delete({ where: { id }, select: { id: true } });
    await tx.user.delete({ where: { id: existing.userId }, select: { id: true } });
  });

  return NextResponse.json({ message: "Kullanıcı silindi." });
}
