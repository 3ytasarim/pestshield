import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StockMovementsPage } from "@/components/inventory/stock-movements-page";
import { serializeStockTransaction, serializeProduct } from "@/lib/inventory/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [transactions, products] = await Promise.all([
    prisma.stockTransaction.findMany({ where: { ownerId }, orderBy: { date: "desc" } }),
    prisma.product.findMany({ where: { ownerId } }),
  ]);

  return (
    <StockMovementsPage
      initialTransactions={transactions.map(serializeStockTransaction)}
      products={products.map(serializeProduct)}
    />
  );
}
