import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { WarehousesPage } from "@/components/inventory/warehouses-page";
import { serializeWarehouse, serializeProduct } from "@/lib/inventory/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [warehouses, products] = await Promise.all([
    prisma.warehouse.findMany({ where: { ownerId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { ownerId } }),
  ]);

  return (
    <WarehousesPage
      initialWarehouses={warehouses.map(serializeWarehouse)}
      products={products.map(serializeProduct)}
    />
  );
}
