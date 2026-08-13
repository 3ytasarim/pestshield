import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { checklistTemplateFormSchema } from "@/lib/validations/operations";
import { serializeChecklistTemplate } from "@/lib/operations/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.checklistTemplate.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Şablon bulunamadı." }, { status: 404 });
  }

  const parsed = checklistTemplateFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const template = await prisma.checklistTemplate.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ checklistTemplate: serializeChecklistTemplate(template) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.checklistTemplate.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Şablon bulunamadı." }, { status: 404 });
  }

  await prisma.checklistTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
