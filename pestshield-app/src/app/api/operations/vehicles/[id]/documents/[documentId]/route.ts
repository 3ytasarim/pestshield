import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { renameDocumentSchema } from "@/lib/validations/documents";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id, documentId } = await params;
  const existing = await prisma.vehicleDocument.findFirst({ where: { id: documentId, vehicleId: id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Belge bulunamadı." }, { status: 404 });
  }

  const parsed = renameDocumentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const document = await prisma.vehicleDocument.update({ where: { id: documentId }, data: parsed.data });
  return NextResponse.json({ document });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id, documentId } = await params;
  const existing = await prisma.vehicleDocument.findFirst({ where: { id: documentId, vehicleId: id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Belge bulunamadı." }, { status: 404 });
  }

  await prisma.vehicleDocument.delete({ where: { id: documentId } });
  return NextResponse.json({ ok: true });
}
