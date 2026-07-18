import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeCorrectiveAction } from "@/lib/audit/serialize";
import { todayStr } from "@/lib/date-utils";
import type { CapaStatus } from "@/lib/mock/audit";

const STATUS_FLOW: CapaStatus[] = ["open", "in_progress", "resolved", "verified"];

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.correctiveAction.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Kayıt bulunamadı." }, { status: 404 });
  }

  const idx = STATUS_FLOW.indexOf(existing.status as CapaStatus);
  const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
  const resolvedDate = next === "resolved" || next === "verified" ? todayStr() : existing.resolvedDate;

  const capa = await prisma.correctiveAction.update({ where: { id }, data: { status: next, resolvedDate } });
  return NextResponse.json({ capa: serializeCorrectiveAction(capa) });
}
