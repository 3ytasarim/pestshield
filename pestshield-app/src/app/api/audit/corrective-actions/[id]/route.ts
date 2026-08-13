import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { capaFormSchema } from "@/lib/validations/audit";
import { serializeCorrectiveAction } from "@/lib/audit/serialize";

// Durum ilerletme (open -> in_progress -> resolved -> verified) [id]/advance route'unda
// ayrı yönetiliyor — bu PATCH sadece içerik alanlarını düzenler, status'e dokunmaz.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.correctiveAction.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  const parsed = capaFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const values = parsed.data;
  const customerId = values.customerId === "none" ? null : values.customerId;
  if (customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
    if (!customer) {
      return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
    }
  }

  const capa = await prisma.correctiveAction.update({
    where: { id },
    data: {
      title: values.title,
      standard: values.standard === "none" ? null : values.standard,
      customerId,
      source: values.source,
      severity: values.severity,
      rootCause: values.rootCause,
      actionPlan: values.actionPlan,
      responsible: values.responsible,
      dueDate: values.dueDate,
    },
  });
  return NextResponse.json({ capa: serializeCorrectiveAction(capa) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.correctiveAction.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  await prisma.correctiveAction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
