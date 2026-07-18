import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { VehiclesPage } from "@/components/operations/vehicles-page";
import { serializeVehicle, serializeTechnician } from "@/lib/operations/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;
  const [vehicles, technicians] = await Promise.all([
    prisma.vehicle.findMany({ where: { ownerId }, include: { warehouse: true }, orderBy: { plate: "asc" } }),
    prisma.technician.findMany({ where: { ownerId }, include: { vehicles: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <VehiclesPage
      initialVehicles={vehicles.map(serializeVehicle)}
      initialTechnicians={technicians.map(serializeTechnician)}
    />
  );
}
