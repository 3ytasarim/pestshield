import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { TechniciansPage } from "@/components/operations/technicians-page";
import { serializeTechnician, serializeVehicle } from "@/lib/operations/serialize";
import { serializeWorkOrder } from "@/lib/crm/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;
  const [technicians, vehicles, workOrders] = await Promise.all([
    prisma.technician.findMany({ where: { ownerId }, include: { vehicles: true }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { ownerId }, orderBy: { plate: "asc" } }),
    prisma.workOrder.findMany({
      where: { ownerId, status: { in: ["planned", "in_progress"] } },
      include: { technician: true },
    }),
  ]);

  return (
    <TechniciansPage
      initialTechnicians={technicians.map(serializeTechnician)}
      initialVehicles={vehicles.map(serializeVehicle)}
      initialOpenWorkOrders={workOrders.map(serializeWorkOrder)}
    />
  );
}
