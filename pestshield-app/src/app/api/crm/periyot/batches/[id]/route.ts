import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const batch = await prisma.periyotBatch.findFirst({ where: { id, ownerId } });
  if (!batch) {
    return NextResponse.json({ message: "Periyot grubu bulunamadı." }, { status: 404 });
  }

  await prisma.periyotBatch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
