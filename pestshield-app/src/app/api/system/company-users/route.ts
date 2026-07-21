import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireClientOwner, getSessionPermissions } from "@/lib/api-auth";
import { companyUserFormSchema } from "@/lib/validations/system";
import { serializeCompanyUser } from "@/lib/system/serialize";

const BCRYPT_ROUNDS = 12;

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const companyUsers = await prisma.companyUser.findMany({
    where: { ownerId },
    include: { role: true, user: { select: { isActive: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ companyUsers: companyUsers.map(serializeCompanyUser) });
}

/** Yeni bir firma içi alt kullanıcı eklendiğinde onun için gerçek bir giriş hesabı (rol: CLIENT) oluşturur — Technician POST deseninin aynısı. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const sessionPermissions = await getSessionPermissions();
  if (!sessionPermissions?.can("/dashboard/client/users", "create")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const parsed = companyUserFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }
  const { name, email, password, roleId } = parsed.data;

  const role = await prisma.companyRole.findFirst({ where: { id: roleId, ownerId } });
  if (!role) {
    return NextResponse.json({ message: "Geçersiz rol." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const companyUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, password: passwordHash, role: "CLIENT" },
      select: { id: true },
    });
    return tx.companyUser.create({
      data: { ownerId, userId: user.id, roleId, name, email },
      include: { role: true, user: { select: { isActive: true } } },
    });
  });

  return NextResponse.json({ companyUser: serializeCompanyUser(companyUser) }, { status: 201 });
}
