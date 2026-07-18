import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { branchFormSchema } from "@/lib/validations/crm";
import { serializeBranch } from "@/lib/crm/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.branch.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Şube bulunamadı." }, { status: 404 });
  }

  const parsed = branchFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const branch = await prisma.branch.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ branch: serializeBranch(branch) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.branch.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Şube bulunamadı." }, { status: 404 });
  }

  await prisma.branch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
