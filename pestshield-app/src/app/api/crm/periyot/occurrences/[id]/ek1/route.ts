import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { requireClientOwner, requireClientOrTechOwner } from "@/lib/api-auth";
import { ek1FormSchema } from "@/lib/validations/periyot";
import { serializeEk1Form } from "@/lib/periyot/serialize";

/** TECH oturumları için ek bir sahiplik kontrolü — bu occurrence'ın hizmetinde "İlgili
 * Personel" olarak GERÇEKTEN bu teknisyen atanmış mı. CLIENT için hiçbir şey değişmez
 * (mevcut davranış aynen korunur), sadece TECH dalına eklenen bir güvenlik katmanı. */
async function assertTechAccess(occurrenceId: string, ownerId: string): Promise<NextResponse | null> {
  const session = await auth();
  if (session?.user?.role !== "TECH") return null;

  const technician = await prisma.technician.findUnique({ where: { userId: session.user.id }, select: { name: true } });
  const occurrence = await prisma.periyotOccurrence.findFirst({
    where: { id: occurrenceId, ownerId },
    include: { serviceOrder: { select: { assignedPersonnel: true } } },
  });
  if (!occurrence) {
    return NextResponse.json({ message: "Periyot ziyareti bulunamadı." }, { status: 404 });
  }
  if (!technician || occurrence.serviceOrder.assignedPersonnel !== technician.name) {
    return NextResponse.json({ message: "Bu hizmete erişim yetkiniz yok." }, { status: 403 });
  }
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;

  const { id } = await params;
  const accessError = await assertTechAccess(id, ownerId);
  if (accessError) return accessError;

  const form = await prisma.ek1Form.findFirst({ where: { periyotOccurrenceId: id, ownerId } });
  return NextResponse.json({ ek1Form: form ? serializeEk1Form(form) : null });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;

  const { id } = await params;
  const accessError = await assertTechAccess(id, ownerId);
  if (accessError) return accessError;

  const occurrence = await prisma.periyotOccurrence.findFirst({ where: { id, ownerId } });
  if (!occurrence) {
    return NextResponse.json({ message: "Periyot ziyareti bulunamadı." }, { status: 404 });
  }

  const parsed = ek1FormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { malzemeKullanimlari, ...values } = parsed.data;

  const form = await prisma.ek1Form.upsert({
    where: { periyotOccurrenceId: id },
    create: {
      ownerId,
      periyotOccurrenceId: id,
      ...values,
      malzemeKullanimlari,
      updatedAt: new Date().toISOString(),
    },
    update: {
      ...values,
      malzemeKullanimlari,
      updatedAt: new Date().toISOString(),
    },
  });

  return NextResponse.json({ ek1Form: serializeEk1Form(form) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.ek1Form.findFirst({ where: { periyotOccurrenceId: id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "EK-1 formu bulunamadı." }, { status: 404 });
  }

  await prisma.ek1Form.delete({ where: { periyotOccurrenceId: id } });
  return NextResponse.json({ success: true });
}
