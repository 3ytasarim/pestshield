import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { workOrderPatchSchema } from "@/lib/validations/crm";
import { serializeWorkOrder } from "@/lib/crm/serialize";
import { syncWorkOrderToCalendar } from "@/lib/integrations/google-calendar/sync";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.workOrder.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "İş emri bulunamadı." }, { status: 404 });
  }

  const parsed = workOrderPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const order = await prisma.workOrder.update({
    where: { id },
    data: parsed.data,
    include: { technician: true },
  });

  try {
    await syncWorkOrderToCalendar(ownerId, order.id);
  } catch {
    // Takvim senkronu iş emri güncellemesini asla engellemez — bkz. sync.ts.
  }

  return NextResponse.json({ workOrder: serializeWorkOrder(order) });
}
