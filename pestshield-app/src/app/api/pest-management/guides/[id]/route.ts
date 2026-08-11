import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { equipmentGuideFormSchema } from "@/lib/validations/pest-management";
import { serializeEquipmentGuideEntry } from "@/lib/pest-management/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.equipmentGuideEntry.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Rehber bulunamadı." }, { status: 404 });
  }

  const parsed = equipmentGuideFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { targetSpeciesIds, ...values } = parsed.data;
  const entry = await prisma.equipmentGuideEntry.update({
    where: { id },
    data: { ...values, targetSpecies: { set: targetSpeciesIds.map((sid) => ({ id: sid })) } },
    include: { targetSpecies: { select: { id: true } } },
  });
  return NextResponse.json({ guide: serializeEquipmentGuideEntry(entry) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.equipmentGuideEntry.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Rehber bulunamadı." }, { status: 404 });
  }

  await prisma.equipmentGuideEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
