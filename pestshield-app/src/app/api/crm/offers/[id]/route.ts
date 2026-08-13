import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { offerFormSchema, offerStatusUpdateSchema } from "@/lib/validations/crm";
import { serializeOffer } from "@/lib/crm/serialize";

/**
 * İki farklı gövde şeklini kabul eder: tam içerik düzenleme (offerFormSchema —
 * Teklifi Düzenle formu) veya sadece durum güncellemesi (Gönder/Kabul Et/Reddet
 * hızlı aksiyonları). Hangisi geldiğine göre dallanır.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.offer.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Teklif bulunamadı." }, { status: 404 });
  }

  const body = await request.json();

  const fullEdit = offerFormSchema.safeParse(body);
  if (fullEdit.success) {
    const { items, vatRate, serviceType: _serviceType, description: _description, notes: _notes, fileDataUrl, fileName, fileSizeKb, ...values } = fullEdit.data;
    void _serviceType;
    void _description;
    void _notes;

    const amount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * (1 + vatRate / 100);

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...values,
        amount,
        fileDataUrl: fileDataUrl ?? null,
        fileName: fileName ?? null,
        fileSizeKb: fileSizeKb ?? 0,
        items: { deleteMany: {}, create: items.map((item) => ({ ...item, ownerId })) },
      },
      include: { items: true },
    });
    return NextResponse.json({ offer: serializeOffer(offer) });
  }

  const statusUpdate = offerStatusUpdateSchema.safeParse(body);
  if (!statusUpdate.success) {
    return NextResponse.json(
      { message: fullEdit.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const offer = await prisma.offer.update({
    where: { id },
    data: statusUpdate.data,
    include: { items: true },
  });
  return NextResponse.json({ offer: serializeOffer(offer) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.offer.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Teklif bulunamadı." }, { status: 404 });
  }

  await prisma.offer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
