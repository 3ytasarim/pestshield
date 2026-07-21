import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";
import { serializeWorkOrder } from "@/lib/crm/serialize";

/** Müşteri portalı — sadece oturumdaki müşterinin kendi iş emirlerini döner, customerId istemciden asla alınmaz. */
export async function GET() {
  const { customerId, ownerId, error } = await requireCustomerOwner();
  if (error) return error;

  const workOrders = await prisma.workOrder.findMany({
    where: { ownerId, customerId },
    include: { technician: true },
    orderBy: { plannedDate: "desc" },
  });
  return NextResponse.json({ workOrders: workOrders.map(serializeWorkOrder) });
}
