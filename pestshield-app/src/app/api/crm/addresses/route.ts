import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { addressFormSchema } from "@/lib/validations/crm";
import { serializeAddress } from "@/lib/crm/serialize";

const createSchema = addressFormSchema.extend({ customerId: z.string().min(1) });

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");
  const addresses = await prisma.address.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
  });
  return NextResponse.json({ addresses: addresses.map(serializeAddress) });
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

  const { customerId, ...values } = parsed.data;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const address = await prisma.address.create({ data: { ...values, ownerId, customerId } });
  return NextResponse.json({ address: serializeAddress(address) });
}
