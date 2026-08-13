import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { collectPaymentFormSchema } from "@/lib/validations/finance";
import { serializeCollection } from "@/lib/finance/serialize";

/**
 * Tahsilat oluşturulurken customer.pendingCollection önbelleğinden (clamp'lı)
 * düşülür (bkz. POST /api/finance/collections) — düzenleme/silme önce eski
 * tutarı geri ekler, sonra (düzenlemede) yeni tutarı aynı clamp mantığıyla
 * tekrar düşer. Müşteri değişirse iki müşteride de.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.collection.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Tahsilat bulunamadı." }, { status: 404 });
  }

  const parsed = collectPaymentFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { customerId, amount, date, method, description } = parsed.data;
  const newCustomer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!newCustomer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const oldAmount = Number(existing.amount);

  const collection = await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: existing.customerId },
      data: { pendingCollection: { increment: oldAmount } },
    });

    const targetCustomer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
    const clampedAmount = Math.min(amount, Number(targetCustomer.pendingCollection));
    await tx.customer.update({
      where: { id: customerId },
      data: { pendingCollection: { decrement: clampedAmount > 0 ? clampedAmount : 0 } },
    });

    return tx.collection.update({
      where: { id },
      data: { customerId, amount, date, method, description },
    });
  });

  return NextResponse.json({ collection: serializeCollection(collection) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.collection.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Tahsilat bulunamadı." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.collection.delete({ where: { id } }),
    prisma.customer.update({
      where: { id: existing.customerId },
      data: { pendingCollection: { increment: Number(existing.amount) } },
    }),
  ]);

  return NextResponse.json({ success: true });
}
