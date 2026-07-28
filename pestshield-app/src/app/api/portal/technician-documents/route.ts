import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";

/** Müşteri portalı — ilaçlama firmasının teknisyenleri için eklediği personel belgeleri (firma geneli). */
export async function GET() {
  const { ownerId, error } = await requireCustomerOwner();
  if (error) return error;

  const documents = await prisma.technicianDocument.findMany({
    where: { ownerId },
    include: { technician: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}
