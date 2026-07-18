import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CollectionsPage } from "@/components/finance/collections-page";
import { serializeCollection } from "@/lib/finance/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [collections, debtors] = await Promise.all([
    prisma.collection.findMany({
      where: { ownerId },
      include: { customer: { select: { id: true, companyName: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.customer.findMany({ where: { ownerId, pendingCollection: { gt: 0 } }, select: { pendingCollection: true } }),
  ]);

  const pendingTotal = debtors.reduce((sum, c) => sum + Number(c.pendingCollection), 0);

  return (
    <CollectionsPage
      initialCollections={collections.map((c) => ({ ...serializeCollection(c), customer: c.customer }))}
      pendingTotal={pendingTotal}
    />
  );
}
