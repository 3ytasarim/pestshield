import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { locationFormSchema } from "@/lib/validations/crm";
import { serializeLocation } from "@/lib/crm/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.location.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Lokasyon bulunamadı." }, { status: 404 });
  }

  const parsed = locationFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const location = await prisma.location.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ location: serializeLocation(location) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.location.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Lokasyon bulunamadı." }, { status: 404 });
  }

  await prisma.location.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
