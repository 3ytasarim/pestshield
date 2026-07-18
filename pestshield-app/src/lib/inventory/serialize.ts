import type {
  Warehouse as PrismaWarehouse,
  Product as PrismaProduct,
  StockTransaction as PrismaStockTransaction,
} from "@/generated/prisma/client";
import type { Warehouse, Product, StockTransaction } from "@/lib/mock/inventory";

export function serializeWarehouse(warehouse: PrismaWarehouse): Warehouse {
  const { ownerId: _ownerId, ...rest } = warehouse;
  void _ownerId;
  return rest;
}

export function serializeProduct(product: PrismaProduct): Product {
  const { ownerId: _ownerId, ...rest } = product;
  void _ownerId;
  return {
    ...rest,
    currentStock: Number(product.currentStock),
    criticalLevel: Number(product.criticalLevel),
    licenseNumber: product.licenseNumber ?? undefined,
    activeIngredient: product.activeIngredient ?? undefined,
    defaultDose: product.defaultDose ?? undefined,
    targetOrganisms: product.targetOrganisms ?? undefined,
  };
}

export function serializeStockTransaction(tx: PrismaStockTransaction): StockTransaction {
  const { ownerId: _ownerId, ...rest } = tx;
  void _ownerId;
  return { ...rest, quantity: Number(tx.quantity) };
}
