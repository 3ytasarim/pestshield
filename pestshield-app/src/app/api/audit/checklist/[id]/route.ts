import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeChecklistItem } from "@/lib/audit/serialize";

const patchSchema = z.object({
  status: z.enum(["compliant", "non_compliant", "pending", "not_applicable"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const existing = await prisma.complianceChecklistItem.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Madde bulunamadı." }, { status: 404 });
  }

  const item = await prisma.complianceChecklistItem.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ item: serializeChecklistItem(item) });
}
