import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeAuditRecord } from "@/lib/audit/serialize";
import { auditRecordEditSchema } from "@/lib/validations/audit";

/**
 * Denetim kaydını günceller — hem "denetim sonucu kaydet" (result alanları) hem de
 * "denetimi düzenle" (planlama alanları: müşteri/standart/tür/denetçi/tarih) akışı
 * bu tek uca tam kayıt gönderir (istemci mevcut kaydı okuyup değişmeyen alanları da yollar).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.auditRecord.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Denetim kaydı bulunamadı." }, { status: 404 });
  }

  const parsed = auditRecordEditSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const values = parsed.data;
  const customer = await prisma.customer.findFirst({ where: { id: values.customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const record = await prisma.auditRecord.update({ where: { id }, data: values });
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
