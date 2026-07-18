import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { addStockFormSchema } from "@/lib/validations/inventory";
import { serializeStockTransaction } from "@/lib/inventory/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const transactions = await prisma.stockTransaction.findMany({ where: { ownerId }, orderBy: { date: "desc" } });
  return NextResponse.json({ stockTransactions: transactions.map(serializeStockTransaction) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = addStockFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { productId, quantity, description } = parsed.data;
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } });
  if (!product) {
    return NextResponse.json({ message: "Ürün bulunamadı." }, { status: 404 });
  }

  const [transaction] = await prisma.$transaction([
    prisma.stockTransaction.create({
      data: {
        ownerId,
        productId,
        type: "add",
        quantity,
        description,
        performedBy: "Siz",
        date: new Date().toISOString().slice(0, 10),
      },
    }),
    prisma.product.update({ where: { id: productId }, data: { currentStock: { increment: quantity } } }),
  ]);

  return NextResponse.json({ stockTransaction: serializeStockTransaction(transaction) }, { status: 201 });
}
