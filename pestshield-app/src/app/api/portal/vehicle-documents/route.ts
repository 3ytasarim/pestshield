import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";

/** Müşteri portalı — ilaçlama firmasının araçları için eklediği araç belgeleri (firma geneli). */
export async function GET() {
  const { ownerId, error } = await requireCustomerOwner();
  if (error) return error;

  const documents = await prisma.vehicleDocument.findMany({
    where: { ownerId },
    include: { vehicle: { select: { plate: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}
