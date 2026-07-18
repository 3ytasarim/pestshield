import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { locationFormSchema } from "@/lib/validations/crm";
import { serializeLocation } from "@/lib/crm/serialize";

const createSchema = locationFormSchema.extend({ customerId: z.string().min(1) });

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");
  const locations = await prisma.location.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ locations: locations.map(serializeLocation) });
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

  const location = await prisma.location.create({
    data: {
      ...values,
      ownerId,
      customerId,
      stationCount: 0,
      lastCheckDate: new Date().toISOString().slice(0, 10),
    },
  });
  return NextResponse.json({ location: serializeLocation(location) });
}
