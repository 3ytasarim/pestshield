import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";
import { serializeCustomer } from "@/lib/crm/serialize";

/** Giriş yapan teknisyenin İş Emri (WorkOrder) üzerinden gerçekten atanmış olduğu
 * müşterileri döner — WorkOrder.technicianId + WorkOrder.customerId aynı satırda
 * birlikte tutulduğu için bu ilişki teknisyen-müşteri atanmışlığının tek FK-temelli
 * kaynağıdır (bkz. PeriyotOccurrence.personnelName serbest metin, güvenilmez). */
export async function GET() {
  const { technicianId, ownerId, error } = await requireTechnician();
  if (error) return error;

  const assignments = await prisma.workOrder.findMany({
    where: { ownerId, technicianId },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const customerIds = assignments.map((a) => a.customerId);

  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    orderBy: { companyName: "asc" },
  });
  return NextResponse.json({ customers: customers.map(serializeCustomer) });
}
