import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OffersPage } from "@/components/crm/offers-page";
import { serializeOffer } from "@/lib/crm/serialize";

export default async function Page() {
  const session = await auth();
  const offers = await prisma.offer.findMany({
    where: { ownerId: session!.user.id },
    include: { items: true, customer: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <OffersPage
      initialOffers={offers.map((o) => ({ ...serializeOffer(o), customer: o.customer }))}
    />
  );
}
