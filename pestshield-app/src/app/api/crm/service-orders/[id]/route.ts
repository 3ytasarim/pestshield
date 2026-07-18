import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serviceOrderPatchSchema } from "@/lib/validations/crm";
import { serializeServiceOrder } from "@/lib/crm/serialize";
import { withholdingFraction } from "@/components/crm/crm-labels";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.serviceOrder.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Hizmet kaydı bulunamadı." }, { status: 404 });
  }

  const parsed = serviceOrderPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { items, ...values } = parsed.data;

  if (items) {
    const withholdingTax = values.withholdingTax ?? existing.withholdingTax;
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const vatTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity * (item.vatRate / 100), 0);
    const withholdingAmount = vatTotal * withholdingFraction(withholdingTax);

    await prisma.serviceOrderItem.deleteMany({ where: { serviceOrderId: id } });
    const order = await prisma.serviceOrder.update({
      where: { id },
      data: {
        ...values,
        subtotal,
        vatTotal,
        withholdingAmount,
        total: subtotal + vatTotal - withholdingAmount,
        items: { create: items.map((item) => ({ ...item, ownerId })) },
      },
      include: { items: true, customer: { select: { id: true, companyName: true, customerType: true } } },
    });
    return NextResponse.json({ serviceOrder: { ...serializeServiceOrder(order), customer: order.customer } });
  }

  const order = await prisma.serviceOrder.update({
    where: { id },
    data: values,
    include: { items: true, customer: { select: { id: true, companyName: true, customerType: true } } },
  });
  return NextResponse.json({ serviceOrder: { ...serializeServiceOrder(order), customer: order.customer } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.serviceOrder.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Hizmet kaydı bulunamadı." }, { status: 404 });
  }

  await prisma.serviceOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
