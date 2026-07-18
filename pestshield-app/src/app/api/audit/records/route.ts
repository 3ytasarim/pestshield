import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeAuditRecord } from "@/lib/audit/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const records = await prisma.auditRecord.findMany({ where: { ownerId }, orderBy: { scheduledDate: "asc" } });
  return NextResponse.json({ records: records.map(serializeAuditRecord) });
}
