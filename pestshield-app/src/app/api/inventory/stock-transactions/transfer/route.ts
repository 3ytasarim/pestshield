import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { transferStockFormSchema } from "@/lib/validations/inventory";
import { serializeStockTransaction, serializeProduct } from "@/lib/inventory/serialize";

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = transferStockFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { productId, toWarehouseId, quantity, description } = parsed.data;

  const sourceProduct = await prisma.product.findFirst({ where: { id: productId, ownerId } });
  if (!sourceProduct) {
    return NextResponse.json({ message: "Ürün bulunamadı." }, { status: 404 });
  }
  if (Number(sourceProduct.currentStock) < quantity) {
    return NextResponse.json({ message: "Yetersiz stok." }, { status: 400 });
  }

  const destinationWarehouse = await prisma.warehouse.findFirst({ where: { id: toWarehouseId, ownerId } });
  if (!destinationWarehouse) {
    return NextResponse.json({ message: "Hedef depo bulunamadı." }, { status: 404 });
  }
  if (destinationWarehouse.id === sourceProduct.warehouseId) {
    return NextResponse.json({ message: "Kaynak ve hedef depo aynı olamaz." }, { status: 400 });
  }

  const [updatedSource, transaction, destinationProduct] = await prisma.$transaction(async (tx) => {
    const updatedSource = await tx.product.update({
      where: { id: sourceProduct.id },
      data: { currentStock: { decrement: quantity } },
    });

    const existingDestination = await tx.product.findFirst({
      where: { ownerId, warehouseId: toWarehouseId, name: { equals: sourceProduct.name, mode: "insensitive" } },
    });

    const destinationProduct = existingDestination
      ? await tx.product.update({
          where: { id: existingDestination.id },
          data: { currentStock: { increment: quantity } },
        })
      : await tx.product.create({
          data: {
            ownerId,
            warehouseId: toWarehouseId,
            name: sourceProduct.name,
            category: sourceProduct.category,
            type: sourceProduct.type,
            manufacturer: sourceProduct.manufacturer,
            unit: sourceProduct.unit,
            currentStock: quantity,
            criticalLevel: sourceProduct.criticalLevel,
            createdAt: new Date().toISOString().slice(0, 10),
            licenseNumber: sourceProduct.licenseNumber,
            activeIngredient: sourceProduct.activeIngredient,
            defaultDose: sourceProduct.defaultDose,
            targetOrganisms: sourceProduct.targetOrganisms,
            packageAmount: sourceProduct.packageAmount,
            antidote: sourceProduct.antidote,
            usageAreas: sourceProduct.usageAreas,
            licenseFileDataUrl: sourceProduct.licenseFileDataUrl,
            licenseFileName: sourceProduct.licenseFileName,
            msdsFileDataUrl: sourceProduct.msdsFileDataUrl,
            msdsFileName: sourceProduct.msdsFileName,
          },
        });

    const transaction = await tx.stockTransaction.create({
      data: {
        ownerId,
        productId: sourceProduct.id,
        type: "transfer",
        quantity,
        description,
        performedBy: "Siz",
        date: new Date().toISOString().slice(0, 10),
        fromWarehouseId: sourceProduct.warehouseId,
        toWarehouseId,
      },
    });

    return [updatedSource, transaction, destinationProduct] as const;
  });

  return NextResponse.json({
    stockTransaction: serializeStockTransaction(transaction),
    sourceProduct: serializeProduct(updatedSource),
    destinationProduct: serializeProduct(destinationProduct),
  });
}
