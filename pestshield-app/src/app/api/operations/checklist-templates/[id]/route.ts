import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.checklistTemplate.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Şablon bulunamadı." }, { status: 404 });
  }

  await prisma.checklistTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
