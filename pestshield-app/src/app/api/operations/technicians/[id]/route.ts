import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { technicianEditFormSchema } from "@/lib/validations/operations";
import { serializeTechnician } from "@/lib/operations/serialize";

const BCRYPT_ROUNDS = 12;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const existing = await prisma.technician.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Teknisyen bulunamadı" }, { status: 404 });
  }

  const parsed = technicianEditFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { name, email, password, googleCalendarId, ...values } = parsed.data;
  const resolvedGoogleCalendarId = googleCalendarId === "none" ? null : googleCalendarId;

  if (email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken && emailTaken.id !== existing.userId) {
      return NextResponse.json({ message: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });
    }
  }

  if (resolvedGoogleCalendarId) {
    const calendarTaken = await prisma.technician.findFirst({
      where: { ownerId, googleCalendarId: resolvedGoogleCalendarId, id: { not: id } },
    });
    if (calendarTaken) {
      return NextResponse.json({ message: `Bu takvim zaten ${calendarTaken.name} adlı teknisyene atanmış.` }, { status: 409 });
    }
  }

  const passwordHash = password ? await bcrypt.hash(password, BCRYPT_ROUNDS) : undefined;

  const technician = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.userId },
      // "Pasif" durumundaki teknisyen mobil panele giriş yapamasın diye
      // auth.ts authorize()'ın kontrol ettiği User.isActive de senkron tutulur.
      data: {
        name,
        email,
        isActive: values.status !== "inactive",
        ...(passwordHash ? { password: passwordHash } : {}),
      },
      select: { id: true },
    });
    return tx.technician.update({
      where: { id },
      data: { name, email, googleCalendarId: resolvedGoogleCalendarId, ...values },
      include: { vehicles: true },
    });
  });

  return NextResponse.json({ technician: serializeTechnician(technician) });
}
