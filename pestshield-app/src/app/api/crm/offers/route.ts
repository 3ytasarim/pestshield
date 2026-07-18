import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { offerFormSchema } from "@/lib/validations/crm";
import { serializeOffer } from "@/lib/crm/serialize";

const createSchema = offerFormSchema.extend({ customerId: z.string().min(1) });

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");
  const offers = await prisma.offer.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ offers: offers.map(serializeOffer) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { customerId, items, vatRate, serviceType: _serviceType, description: _description, notes: _notes, ...values } = parsed.data;
  void _serviceType;
  void _description;
  void _notes;

  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const amount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * (1 + vatRate / 100);
  const offerCount = await prisma.offer.count({ where: { ownerId, customerId } });

  const offer = await prisma.offer.create({
    data: {
      ...values,
      ownerId,
      customerId,
      offerNo: `TKL-2026-${String(offerCount + 1).padStart(2, "0")}`,
      amount,
      currency: "TRY",
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
      items: { create: items.map((item) => ({ ...item, ownerId })) },
    },
    include: { items: true },
  });
  return NextResponse.json({ offer: serializeOffer(offer) });
}
