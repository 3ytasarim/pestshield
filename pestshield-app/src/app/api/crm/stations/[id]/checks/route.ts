import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOrTechOwner, requireTechnician } from "@/lib/api-auth";
import { stationCheckSubmitSchema } from "@/lib/validations/operations";
import { serializeStationCheck } from "@/lib/operations/serialize";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;
  const { id } = await params;

  const station = await prisma.station.findFirst({ where: { id, ownerId } });
  if (!station) {
    return NextResponse.json({ message: "İstasyon bulunamadı." }, { status: 404 });
  }

  const checks = await prisma.stationCheck.findMany({
    where: { stationId: id },
    include: { technician: true },
    orderBy: { checkedAt: "desc" },
  });
  return NextResponse.json({ checks: checks.map(serializeStationCheck) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { technicianId, ownerId, error } = await requireTechnician();
  if (error) return error;
  const { id } = await params;

  const station = await prisma.station.findFirst({ where: { id, ownerId } });
  if (!station) {
    return NextResponse.json({ message: "İstasyon bulunamadı." }, { status: 404 });
  }

  const parsed = stationCheckSubmitSchema.safeParse({ ...(await request.json()), stationId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { activityFound, activityLevel, actionTaken, note } = parsed.data;
  const checkedAt = new Date().toISOString();

  const [check] = await prisma.$transaction([
    prisma.stationCheck.create({
      data: { ownerId, stationId: id, technicianId, checkedAt, activityFound, activityLevel, actionTaken, note },
      include: { technician: true },
    }),
    prisma.station.update({
      where: { id },
      data: {
        lastCheckDate: checkedAt.slice(0, 10),
        status: activityFound ? "needs_attention" : "active",
      },
    }),
  ]);

  return NextResponse.json({ check: serializeStationCheck(check) }, { status: 201 });
}
