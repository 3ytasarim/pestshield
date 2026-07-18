import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { collectPaymentFormSchema } from "@/lib/validations/finance";
import { serializeCollection } from "@/lib/finance/serialize";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");

  const collections = await prisma.collection.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ collections: collections.map(serializeCollection) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = collectPaymentFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { customerId, amount, date, method, description } = parsed.data;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const clampedAmount = Math.min(amount, Number(customer.pendingCollection));

  const [collection] = await prisma.$transaction([
    prisma.collection.create({
      data: { ownerId, customerId, date, amount, method, description: description || "Tahsilat", performedBy: "Siz" },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: { pendingCollection: { decrement: clampedAmount > 0 ? clampedAmount : 0 } },
    }),
  ]);

  return NextResponse.json({ collection: serializeCollection(collection) }, { status: 201 });
}
