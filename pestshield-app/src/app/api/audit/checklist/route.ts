import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOrTechOwner } from "@/lib/api-auth";
import { ensureChecklistSeeded, serializeChecklistItem } from "@/lib/audit/serialize";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");

  await ensureChecklistSeeded(prisma, ownerId, customerId);

  const items = await prisma.complianceChecklistItem.findMany({ where: { ownerId, customerId }, orderBy: { id: "asc" } });
  return NextResponse.json({ items: items.map(serializeChecklistItem) });
}
