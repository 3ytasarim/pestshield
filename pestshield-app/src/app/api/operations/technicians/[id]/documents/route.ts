import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { createDocumentSchema } from "@/lib/validations/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const technician = await prisma.technician.findFirst({ where: { id, ownerId } });
  if (!technician) {
    return NextResponse.json({ message: "Teknisyen bulunamadı" }, { status: 404 });
  }

  const documents = await prisma.technicianDocument.findMany({
    where: { technicianId: id, ownerId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const technician = await prisma.technician.findFirst({ where: { id, ownerId } });
  if (!technician) {
    return NextResponse.json({ message: "Teknisyen bulunamadı" }, { status: 404 });
  }

  const parsed = createDocumentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const document = await prisma.technicianDocument.create({
    data: { ownerId, technicianId: id, ...parsed.data },
  });
  return NextResponse.json({ document }, { status: 201 });
}
