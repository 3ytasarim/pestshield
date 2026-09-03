import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { TechCalendarPage } from "@/components/tech/tech-calendar-page";
import { serializeWorkOrder } from "@/lib/crm/serialize";

export default async function TechCalendarRoutePage() {
  const session = await auth();

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

  return <TechCalendarPage orders={myOrders} />;
}
