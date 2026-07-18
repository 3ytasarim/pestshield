import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { contactFormSchema } from "@/lib/validations/crm";
import { serializeContact } from "@/lib/crm/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.contact.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kişi bulunamadı." }, { status: 404 });
  }

  const parsed = contactFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const contact = await prisma.contact.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ contact: serializeContact(contact) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.contact.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kişi bulunamadı." }, { status: 404 });
  }

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
