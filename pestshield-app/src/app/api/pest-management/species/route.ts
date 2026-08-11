import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { pestSpeciesFormSchema } from "@/lib/validations/pest-management";
import { serializePestSpeciesEntry } from "@/lib/pest-management/serialize";
import { ensurePestManagementSeeded } from "@/lib/pest-management/seed-defaults";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  await ensurePestManagementSeeded(ownerId);

  const entries = await prisma.pestSpeciesEntry.findMany({ where: { ownerId }, orderBy: { name: "asc" } });
  return NextResponse.json({ species: entries.map(serializePestSpeciesEntry) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = pestSpeciesFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const entry = await prisma.pestSpeciesEntry.create({ data: { ...parsed.data, ownerId } });
  return NextResponse.json({ species: serializePestSpeciesEntry(entry) });
}
