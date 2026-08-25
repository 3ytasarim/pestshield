import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { TechHomeClient } from "@/components/tech/tech-home-client";
import { serializeWorkOrder } from "@/lib/crm/serialize";

export default async function TechDashboardPage() {
  const session = await auth();
  const techName = session?.user?.name ?? "";

  const technician = session?.user?.id
    ? await prisma.technician.findUnique({ where: { userId: session.user.id } })
    : null;

  const orders = technician
    ? await prisma.workOrder.findMany({
        where: { ownerId: technician.ownerId, technicianId: technician.id },
        include: { technician: true, customer: { select: { id: true, companyName: true } } },
        orderBy: { plannedDate: "asc" },
      })
    : [];

  const myOrders = orders.map((o) => ({ ...serializeWorkOrder(o), customer: o.customer }));

  return <TechHomeClient userName={techName} orders={myOrders} />;
}
