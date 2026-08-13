import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { stationFormSchema } from "@/lib/validations/operations";
import { serializeStation } from "@/lib/operations/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.station.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "İstasyon bulunamadı." }, { status: 404 });
  }

  const parsed = stationFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { locationId, label, type } = parsed.data;
  const location = await prisma.location.findFirst({ where: { id: locationId, ownerId } });
  if (!location) {
    return NextResponse.json({ message: "Lokasyon bulunamadı." }, { status: 404 });
  }

  if (locationId !== existing.locationId) {
    await prisma.$transaction([
      prisma.location.update({ where: { id: existing.locationId }, data: { stationCount: { decrement: 1 } } }),
      prisma.location.update({ where: { id: locationId }, data: { stationCount: { increment: 1 } } }),
    ]);
  }

  const station = await prisma.station.update({
    where: { id },
    data: { customerId: location.customerId, locationId, label, type },
  });
  return NextResponse.json({ station: serializeStation(station) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.station.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "İstasyon bulunamadı." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.station.delete({ where: { id } }),
    prisma.location.update({ where: { id: existing.locationId }, data: { stationCount: { decrement: 1 } } }),
  ]);

  return NextResponse.json({ success: true });
}
