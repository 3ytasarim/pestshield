import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { checklistTemplateFormSchema } from "@/lib/validations/operations";
import { serializeChecklistTemplate } from "@/lib/operations/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const templates = await prisma.checklistTemplate.findMany({ where: { ownerId }, orderBy: { title: "asc" } });
  return NextResponse.json({ checklistTemplates: templates.map(serializeChecklistTemplate) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = checklistTemplateFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const template = await prisma.checklistTemplate.create({ data: { ...parsed.data, ownerId } });
  return NextResponse.json({ checklistTemplate: serializeChecklistTemplate(template) }, { status: 201 });
}
