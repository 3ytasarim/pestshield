import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { parasutSelectCompanySchema } from "@/lib/validations/integrations";

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = parasutSelectCompanySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const existing = await prisma.parasutIntegration.findUnique({ where: { ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Önce Paraşüt yetkilendirmesi yapmanız gerekiyor." }, { status: 400 });
  }

  await prisma.parasutIntegration.update({
    where: { ownerId },
    data: {
      parasutCompanyId: parsed.data.companyId,
      parasutCompanyName: parsed.data.companyName,
      connectedAt: new Date(),
    },
  });

  return NextResponse.json({ connected: true });
}
