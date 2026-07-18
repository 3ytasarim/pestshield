import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { contactFormSchema } from "@/lib/validations/crm";
import { serializeContact } from "@/lib/crm/serialize";

const createSchema = contactFormSchema.extend({ customerId: z.string().min(1) });

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");
  const contacts = await prisma.contact.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ contacts: contacts.map(serializeContact) });
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

  const contact = await prisma.contact.create({ data: { ...values, ownerId, customerId } });
  return NextResponse.json({ contact: serializeContact(contact) });
}
