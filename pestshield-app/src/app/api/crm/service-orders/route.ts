import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serviceOrderCreateSchema } from "@/lib/validations/crm";
import { serializeServiceOrder } from "@/lib/crm/serialize";
import { withholdingFraction } from "@/components/crm/crm-labels";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");
  const orders = await prisma.serviceOrder.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    include: { items: true, customer: { select: { id: true, companyName: true, customerType: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    serviceOrders: orders.map((o) => ({ ...serializeServiceOrder(o), customer: o.customer })),
  });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = serviceOrderCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { customerId, items, contractFileDataUrl, contractFileName, ...values } = parsed.data;

  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const vatTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity * (item.vatRate / 100), 0);
  const withholdingAmount = vatTotal * withholdingFraction(values.withholdingTax);
  const orderCount = await prisma.serviceOrder.count({ where: { ownerId, customerId } });

  const order = await prisma.serviceOrder.create({
    data: {
      ...values,
      ownerId,
      customerId,
      serviceNo: `HZM-2026-${String(orderCount + 1).padStart(2, "0")}`,
      subtotal,
      vatTotal,
      withholdingAmount,
      total: subtotal + vatTotal - withholdingAmount,
      contractFileDataUrl: contractFileDataUrl ?? null,
      contractFileName: contractFileName ?? null,
      createdAt: new Date().toISOString().slice(0, 10),
      items: { create: items.map((item) => ({ ...item, ownerId })) },
    },
    include: { items: true, customer: { select: { id: true, companyName: true, customerType: true } } },
  });
  return NextResponse.json({ serviceOrder: { ...serializeServiceOrder(order), customer: order.customer } });
}
