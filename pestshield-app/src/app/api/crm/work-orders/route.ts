import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireClientOwner, requireClientOrTechOwner } from "@/lib/api-auth";
import { workOrderFormSchema } from "@/lib/validations/crm";
import { serializeWorkOrder } from "@/lib/crm/serialize";
import { syncWorkOrderToCalendar } from "@/lib/integrations/google-calendar/sync";

const createSchema = workOrderFormSchema.extend({ customerId: z.string().min(1) });

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;

  const session = await auth();
  const customerId = new URL(request.url).searchParams.get("customerId");

  let technicianFilter: { technicianId: string } | Record<string, never> = {};
  if (session?.user.role === "TECH") {
    const technician = await prisma.technician.findUnique({ where: { userId: session.user.id } });
    technicianFilter = technician ? { technicianId: technician.id } : {};
  }

  const orders = await prisma.workOrder.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}), ...technicianFilter },
    include: { technician: true },
    orderBy: { plannedDate: "desc" },
  });
  return NextResponse.json({ workOrders: orders.map(serializeWorkOrder) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { customerId, technicianId, ...values } = parsed.data;

  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }
  const technician = await prisma.technician.findFirst({ where: { id: technicianId, ownerId } });
  if (!technician) {
    return NextResponse.json({ message: "Teknisyen bulunamadı." }, { status: 404 });
  }

  const orderCount = await prisma.workOrder.count({ where: { ownerId, customerId } });

  const order = await prisma.workOrder.create({
    data: {
      ...values,
      ownerId,
      customerId,
      technicianId,
      orderNo: `IS-2026-${String(orderCount + 1).padStart(3, "0")}`,
      status: "planned",
    },
    include: { technician: true },
  });

  try {
    await syncWorkOrderToCalendar(ownerId, order.id);
  } catch {
    // Takvim senkronu iş emri oluşturmayı asla engellemez — bkz. sync.ts.
  }

  return NextResponse.json({ workOrder: serializeWorkOrder(order) }, { status: 201 });
}
