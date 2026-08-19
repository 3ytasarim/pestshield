import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StationsPage } from "@/components/operations/stations-page";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;
  const [krokiStations, customers] = await Promise.all([
    prisma.krokiStation.findMany({
      where: { ownerId },
      include: {
        krokiSketch: {
          select: {
            name: true,
            serviceOrder: { select: { description: true, customer: { select: { id: true, companyName: true } } } },
          },
        },
      },
      orderBy: { number: "asc" },
    }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <StationsPage
      initialStations={krokiStations.map((s) => ({
        id: s.id,
        type: s.type,
        number: s.number,
        stationId: s.stationId,
        sketchName: s.krokiSketch.name,
        serviceName: s.krokiSketch.serviceOrder.description,
        customer: s.krokiSketch.serviceOrder.customer,
      }))}
      customers={customers}
    />
  );
}
