import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LocationsPage } from "@/components/crm/locations-page";

export default async function Page() {
  const session = await auth();
  const locations = await prisma.location.findMany({
    where: { ownerId: session!.user.id },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <LocationsPage
      initialLocations={locations.map(({ ownerId: _ownerId, ...l }) => l)}
    />
  );
}
