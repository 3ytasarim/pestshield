import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";
import { serializeServiceOrder } from "@/lib/crm/serialize";

/** Müşteri portalı — sadece giriş yapan müşteriye ait hizmet kayıtları (salt okunur). */
export async function GET() {
  const { ownerId, customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const orders = await prisma.serviceOrder.findMany({
    where: { ownerId, customerId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ serviceOrders: orders.map(serializeServiceOrder) });
}
