import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CriticalStockPage } from "@/components/inventory/critical-stock-page";
import { serializeProduct, serializeWarehouse } from "@/lib/inventory/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [products, warehouses] = await Promise.all([
    prisma.product.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } }),
    prisma.warehouse.findMany({ where: { ownerId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <CriticalStockPage
      initialProducts={products.map(serializeProduct)}
      warehouses={warehouses.map(serializeWarehouse)}
    />
  );
}
