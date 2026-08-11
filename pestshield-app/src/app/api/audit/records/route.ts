import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeAuditRecord } from "@/lib/audit/serialize";
import { auditRecordFormSchema } from "@/lib/validations/audit";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const records = await prisma.auditRecord.findMany({ where: { ownerId }, orderBy: { scheduledDate: "asc" } });
  return NextResponse.json({ records: records.map(serializeAuditRecord) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = auditRecordFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({ where: { id: parsed.data.customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const record = await prisma.auditRecord.create({
    data: { ...parsed.data, ownerId, result: "scheduled" },
  });
  return NextResponse.json({ record: serializeAuditRecord(record) });
}
