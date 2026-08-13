import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { riskPatchSchema } from "@/lib/validations/audit";
import { serializeRisk } from "@/lib/audit/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.risk.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Risk kaydı bulunamadı." }, { status: 404 });
  }

  const parsed = riskPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { customerId: rawCustomerId, owner: ownerName, status, ...rest } = parsed.data;
  const customerId = rawCustomerId === "none" ? null : rawCustomerId;
  if (customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
    if (!customer) {
      return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
    }
  }

  const risk = await prisma.risk.update({
    where: { id },
    data: { ...rest, ownerName, customerId, ...(status ? { status } : {}) },
  });
  return NextResponse.json({ risk: serializeRisk(risk) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.risk.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Risk kaydı bulunamadı." }, { status: 404 });
  }

  await prisma.risk.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
