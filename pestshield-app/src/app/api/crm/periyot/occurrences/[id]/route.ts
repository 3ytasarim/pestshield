import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { updateOccurrenceSchema } from "@/lib/validations/periyot";
import { serializePeriyotOccurrence } from "@/lib/periyot/serialize";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const occurrence = await prisma.periyotOccurrence.findFirst({ where: { id, ownerId }, include: { biocidalProductUsages: true } });
  if (!occurrence) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ occurrence: serializePeriyotOccurrence(occurrence) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const parsed = updateOccurrenceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { biocidalProductUsages, ...patch } = parsed.data;

  const existing = await prisma.periyotOccurrence.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  const occurrence = await prisma.$transaction(async (tx) => {
    await tx.periyotOccurrence.update({ where: { id }, data: patch });

    if (biocidalProductUsages) {
      await tx.periyotBiocidalProductUsage.deleteMany({ where: { occurrenceId: id } });
      if (biocidalProductUsages.length > 0) {
        await tx.periyotBiocidalProductUsage.createMany({
          data: biocidalProductUsages.map((u) => ({
            ownerId,
            occurrenceId: id,
            productId: u.productId || null,
            productName: u.productName,
            amount: u.amount,
            unit: u.unit,
          })),
        });
      }
    }

    return tx.periyotOccurrence.findUniqueOrThrow({ where: { id }, include: { biocidalProductUsages: true } });
  });

  return NextResponse.json({ occurrence: serializePeriyotOccurrence(occurrence) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.periyotOccurrence.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  await prisma.periyotOccurrence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
