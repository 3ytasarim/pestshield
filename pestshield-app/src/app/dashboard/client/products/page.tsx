import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { InventoryPage } from "@/components/inventory/inventory-page";
import { serializeProduct, serializeStockTransaction, serializeWarehouse } from "@/lib/inventory/serialize";

export default async function ProductsPage() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [products, transactions, warehouses] = await Promise.all([
    prisma.product.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } }),
    prisma.stockTransaction.findMany({ where: { ownerId }, orderBy: { date: "desc" } }),
    prisma.warehouse.findMany({ where: { ownerId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <InventoryPage
      initialProducts={products.map(serializeProduct)}
      initialTransactions={transactions.map(serializeStockTransaction)}
      warehouses={warehouses.map(serializeWarehouse)}
    />
  );
}
