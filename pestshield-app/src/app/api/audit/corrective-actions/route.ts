import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { capaFormSchema } from "@/lib/validations/audit";
import { serializeCorrectiveAction } from "@/lib/audit/serialize";
import { todayStr } from "@/lib/date-utils";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const capas = await prisma.correctiveAction.findMany({ where: { ownerId }, orderBy: { createdDate: "desc" } });
  return NextResponse.json({ capas: capas.map(serializeCorrectiveAction) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = capaFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const values = parsed.data;
  const customerId = values.customerId === "none" ? null : values.customerId;
  if (customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
    if (!customer) {
      return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
    }
  }

  const capa = await prisma.correctiveAction.create({
    data: {
      ownerId,
      title: values.title,
      standard: values.standard === "none" ? null : values.standard,
      customerId,
      source: values.source,
      severity: values.severity,
      rootCause: values.rootCause,
      actionPlan: values.actionPlan,
      responsible: values.responsible,
      createdDate: todayStr(),
      dueDate: values.dueDate,
      status: "open",
    },
  });
  return NextResponse.json({ capa: serializeCorrectiveAction(capa) }, { status: 201 });
}
