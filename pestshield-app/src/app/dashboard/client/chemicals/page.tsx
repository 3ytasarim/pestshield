import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ChemicalsPage } from "@/components/pest-management/chemicals-page";
import { serializeProduct } from "@/lib/inventory/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const products = await prisma.product.findMany({ where: { ownerId }, orderBy: { name: "asc" } });

  return <ChemicalsPage products={products.map(serializeProduct)} />;
}
