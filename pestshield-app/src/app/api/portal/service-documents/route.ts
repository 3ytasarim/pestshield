import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";

/** Müşteri portalı — teklif oluşturulurken eklenen "Teklif Kabul" belgeleri. */
export async function GET() {
  const { customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const offers = await prisma.offer.findMany({
    where: { customerId, fileDataUrl: { not: null } },
    select: { id: true, createdAt: true, fileDataUrl: true, fileName: true, fileSizeKb: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents: offers });
}
