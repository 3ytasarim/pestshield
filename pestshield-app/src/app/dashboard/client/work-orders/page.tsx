import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { WorkOrdersPage } from "@/components/operations/work-orders-page";
import { serializeWorkOrder } from "@/lib/crm/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;
  const orders = await prisma.workOrder.findMany({
    where: { ownerId },
    include: { technician: true, customer: { select: { id: true, companyName: true, contactName: true, contactPhone: true } } },
    orderBy: { plannedDate: "desc" },
  });

  return (
    <WorkOrdersPage
      initialOrders={orders.map((o) => ({ ...serializeWorkOrder(o), customer: o.customer }))}
    />
  );
}
