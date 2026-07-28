import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { createDocumentSchema } from "@/lib/validations/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, ownerId } });
  if (!vehicle) {
    return NextResponse.json({ message: "Araç bulunamadı" }, { status: 404 });
  }

  const documents = await prisma.vehicleDocument.findMany({
    where: { vehicleId: id, ownerId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, ownerId } });
  if (!vehicle) {
    return NextResponse.json({ message: "Araç bulunamadı" }, { status: 404 });
  }

  const parsed = createDocumentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const document = await prisma.vehicleDocument.create({
    data: { ownerId, vehicleId: id, ...parsed.data },
  });
  return NextResponse.json({ document }, { status: 201 });
}
