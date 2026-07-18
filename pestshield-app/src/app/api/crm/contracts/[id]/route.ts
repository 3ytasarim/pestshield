import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { contractStatusUpdateSchema } from "@/lib/validations/crm";
import { serializeContract } from "@/lib/crm/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.contract.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Sözleşme bulunamadı." }, { status: 404 });
  }

  const parsed = contractStatusUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const contract = await prisma.contract.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ contract: serializeContract(contract) });
}
