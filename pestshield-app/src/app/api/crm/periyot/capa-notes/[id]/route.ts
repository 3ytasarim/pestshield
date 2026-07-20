import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.periyotCapaNote.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  await prisma.periyotCapaNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
