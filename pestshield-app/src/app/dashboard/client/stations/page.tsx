import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StationsPage } from "@/components/operations/stations-page";
import { serializeStation } from "@/lib/operations/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;
  const [stations, customers] = await Promise.all([
    prisma.station.findMany({
      where: { ownerId },
      include: { customer: { select: { id: true, companyName: true } } },
      orderBy: { label: "asc" },
    }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <StationsPage
      initialStations={stations.map((s) => ({ ...serializeStation(s), customer: s.customer }))}
      customers={customers}
    />
  );
}
