import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { offerStatusUpdateSchema } from "@/lib/validations/crm";
import { serializeOffer } from "@/lib/crm/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.offer.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Teklif bulunamadı." }, { status: 404 });
  }

  const parsed = offerStatusUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const offer = await prisma.offer.update({
    where: { id },
    data: parsed.data,
    include: { items: true },
  });
  return NextResponse.json({ offer: serializeOffer(offer) });
}
