import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner, requireClientOrTechOwner } from "@/lib/api-auth";
import { stationFormSchema } from "@/lib/validations/operations";
import { serializeStation } from "@/lib/operations/serialize";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");
  const qrCode = url.searchParams.get("qrCode");

  const stations = await prisma.station.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}), ...(qrCode ? { qrCode } : {}) },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: { label: "asc" },
  });
  return NextResponse.json({
    stations: stations.map((s) => ({ ...serializeStation(s), customer: s.customer })),
  });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

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

  const qrCode = `PS-STN-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  const station = await prisma.station.create({
    data: {
      ownerId,
      customerId: location.customerId,
      locationId,
      label,
      type,
      qrCode,
      installedDate: today,
      nextCheckDue: today,
    },
  });

  await prisma.location.update({
    where: { id: locationId },
    data: { stationCount: { increment: 1 } },
  });

  return NextResponse.json({ station: serializeStation(station) }, { status: 201 });
}
