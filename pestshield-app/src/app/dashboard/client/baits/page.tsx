import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { EquipmentCategoryPage } from "@/components/pest-management/equipment-category-page";
import { serializeProduct } from "@/lib/inventory/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const products = await prisma.product.findMany({ where: { ownerId }, orderBy: { name: "asc" } });

  return <EquipmentCategoryPage category="bait" products={products.map(serializeProduct)} />;
}
