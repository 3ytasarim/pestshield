import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { addressFormSchema } from "@/lib/validations/crm";
import { serializeAddress } from "@/lib/crm/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.address.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Adres bulunamadı." }, { status: 404 });
  }

  const parsed = addressFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const address = await prisma.address.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ address: serializeAddress(address) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.address.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Adres bulunamadı." }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
