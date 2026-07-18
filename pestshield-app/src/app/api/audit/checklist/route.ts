import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { ensureChecklistSeeded, serializeChecklistItem } from "@/lib/audit/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  await ensureChecklistSeeded(prisma, ownerId);

  const items = await prisma.complianceChecklistItem.findMany({ where: { ownerId }, orderBy: { id: "asc" } });
  return NextResponse.json({ items: items.map(serializeChecklistItem) });
}
