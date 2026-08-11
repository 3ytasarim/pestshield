import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeAuditRecord } from "@/lib/audit/serialize";
import { auditRecordResultFormSchema } from "@/lib/validations/audit";

/** Planlanmış bir denetimin sonucunu kaydeder (denetim gerçekleştikten sonra) — result artık "scheduled" değildir. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.auditRecord.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Denetim kaydı bulunamadı." }, { status: 404 });
  }

  const parsed = auditRecordResultFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const record = await prisma.auditRecord.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ record: serializeAuditRecord(record) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.auditRecord.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Denetim kaydı bulunamadı." }, { status: 404 });
  }

  await prisma.auditRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
