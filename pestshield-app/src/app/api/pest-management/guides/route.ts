import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { equipmentCategorySchema, equipmentGuideFormSchema } from "@/lib/validations/pest-management";
import { serializeEquipmentGuideEntry } from "@/lib/pest-management/serialize";
import { ensurePestManagementSeeded } from "@/lib/pest-management/seed-defaults";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  await ensurePestManagementSeeded(ownerId);

  const categoryParam = equipmentCategorySchema.safeParse(new URL(request.url).searchParams.get("category"));
  const entries = await prisma.equipmentGuideEntry.findMany({
    where: { ownerId, ...(categoryParam.success ? { category: categoryParam.data } : {}) },
    include: { targetSpecies: { select: { id: true } } },
    orderBy: { title: "asc" },
  });
  return NextResponse.json({ guides: entries.map(serializeEquipmentGuideEntry) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = equipmentGuideFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { targetSpeciesIds, ...values } = parsed.data;
  const entry = await prisma.equipmentGuideEntry.create({
    data: { ...values, ownerId, targetSpecies: { connect: targetSpeciesIds.map((id) => ({ id })) } },
    include: { targetSpecies: { select: { id: true } } },
  });
  return NextResponse.json({ guide: serializeEquipmentGuideEntry(entry) });
}
