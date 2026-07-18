import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { technicianFormSchema } from "@/lib/validations/operations";
import { serializeTechnician } from "@/lib/operations/serialize";

const BCRYPT_ROUNDS = 12;

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const technicians = await prisma.technician.findMany({
    where: { ownerId },
    include: { vehicles: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ technicians: technicians.map(serializeTechnician) });
}

/** Yeni bir teknisyen eklendiğinde onun için gerçek bir giriş hesabı (rol: TECH) oluşturur. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = technicianFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { name, email, password, ...values } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const technician = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, password: passwordHash, role: "TECH" },
    });
    return tx.technician.create({
      data: { ...values, name, email, ownerId, userId: user.id },
      include: { vehicles: true },
    });
  });

  return NextResponse.json({ technician: serializeTechnician(technician) }, { status: 201 });
}
