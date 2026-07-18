import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { vehicleFormSchema } from "@/lib/validations/operations";
import { serializeVehicle } from "@/lib/operations/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId },
    include: { warehouse: true },
    orderBy: { plate: "asc" },
  });
  return NextResponse.json({ vehicles: vehicles.map(serializeVehicle) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = vehicleFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { assignedTechnicianId, ...values } = parsed.data;
  const resolvedTechnicianId = assignedTechnicianId === "none" ? null : assignedTechnicianId;

  if (resolvedTechnicianId) {
    const technician = await prisma.technician.findFirst({ where: { id: resolvedTechnicianId, ownerId } });
    if (!technician) {
      return NextResponse.json({ message: "Teknisyen bulunamadı." }, { status: 404 });
    }
  }

  const vehicle = await prisma.vehicle.create({
    data: { ...values, ownerId, assignedTechnicianId: resolvedTechnicianId, warehouseId: null },
  });
  return NextResponse.json({ vehicle: serializeVehicle(vehicle) }, { status: 201 });
}
