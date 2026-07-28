import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

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
