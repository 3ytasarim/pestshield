import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { contractFormSchema, contractStatusUpdateSchema } from "@/lib/validations/crm";
import { serializeContract } from "@/lib/crm/serialize";

/**
 * İki farklı gövde şeklini kabul eder: tam içerik düzenleme (contractFormSchema —
 * Sözleşmeyi Düzenle formu) veya sadece durum güncellemesi (İptal Et/Yenile hızlı
 * aksiyonları). Hangisi geldiğine göre dallanır.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.contract.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Sözleşme bulunamadı." }, { status: 404 });
  }

  const body = await request.json();

  const fullEdit = contractFormSchema.safeParse(body);
  if (fullEdit.success) {
    const { servicePeriod: _servicePeriod, description: _description, ...values } = fullEdit.data;
    void _servicePeriod;
    void _description;

    const remainingDays = Math.round((new Date(values.endDate).getTime() - Date.now()) / 86_400_000);
    const status = existing.status === "cancelled" ? "cancelled" : remainingDays < 0 ? "expired" : remainingDays <= 30 ? "expiring" : "active";

    const contract = await prisma.contract.update({
      where: { id },
      data: { ...values, status, remainingDays },
    });
    return NextResponse.json({ contract: serializeContract(contract) });
  }

  const statusUpdate = contractStatusUpdateSchema.safeParse(body);
  if (!statusUpdate.success) {
    return NextResponse.json(
      { message: fullEdit.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const contract = await prisma.contract.update({ where: { id }, data: statusUpdate.data });
  return NextResponse.json({ contract: serializeContract(contract) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.contract.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Sözleşme bulunamadı." }, { status: 404 });
  }

  await prisma.contract.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
