import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ServicePlanningPage } from "@/components/operations/service-planning-page";
import { serializeWorkOrder } from "@/lib/crm/serialize";
import { serializeTechnician } from "@/lib/operations/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;
  const [orders, technicians] = await Promise.all([
    prisma.workOrder.findMany({
      where: { ownerId },
      include: { technician: true, customer: { select: { id: true, companyName: true } } },
      orderBy: { plannedDate: "desc" },
    }),
    prisma.technician.findMany({ where: { ownerId }, include: { vehicles: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <ServicePlanningPage
      initialOrders={orders.map((o) => ({ ...serializeWorkOrder(o), customer: o.customer }))}
      initialTechnicians={technicians.map(serializeTechnician)}
    />
  );
}
