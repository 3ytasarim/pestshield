import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { pestSpeciesFormSchema } from "@/lib/validations/pest-management";
import { serializePestSpeciesEntry } from "@/lib/pest-management/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.pestSpeciesEntry.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Tür bulunamadı." }, { status: 404 });
  }

  const parsed = pestSpeciesFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const entry = await prisma.pestSpeciesEntry.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ species: serializePestSpeciesEntry(entry) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.pestSpeciesEntry.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Tür bulunamadı." }, { status: 404 });
  }

  await prisma.pestSpeciesEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
