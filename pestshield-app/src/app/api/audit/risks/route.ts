import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { riskFormSchema } from "@/lib/validations/audit";
import { serializeRisk } from "@/lib/audit/serialize";
import { todayStr } from "@/lib/date-utils";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const risks = await prisma.risk.findMany({ where: { ownerId }, orderBy: { reviewDate: "desc" } });
  return NextResponse.json({ risks: risks.map(serializeRisk) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = riskFormSchema.safeParse(await request.json());
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

  const risk = await prisma.risk.create({
    data: {
      ownerId,
      title: values.title,
      category: values.category,
      description: values.description,
      likelihood: values.likelihood,
      impact: values.impact,
      mitigation: values.mitigation,
      ownerName: values.owner,
      status: "open",
      reviewDate: todayStr(),
      customerId,
    },
  });
  return NextResponse.json({ risk: serializeRisk(risk) }, { status: 201 });
}
