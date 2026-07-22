import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { vehicleFormSchema } from "@/lib/validations/operations";
import { serializeVehicle } from "@/lib/operations/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const existing = await prisma.vehicle.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Araç bulunamadı" }, { status: 404 });
  }

  const parsed = vehicleFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { assignedTechnicianId, ...values } = parsed.data;
  const resolvedTechnicianId = assignedTechnicianId === "none" ? null : assignedTechnicianId;

  if (resolvedTechnicianId) {
    const technician = await prisma.technician.findFirst({ where: { id: resolvedTechnicianId, ownerId } });
    if (!technician) {
      return NextResponse.json({ message: "Teknisyen bulunamadı." }, { status: 404 });
    }
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { ...values, assignedTechnicianId: resolvedTechnicianId },
    include: { warehouse: true },
  });

  return NextResponse.json({ vehicle: serializeVehicle(vehicle) });
}
