import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";

/** Müşteri portalı — bu müşteride kullanılan biyosidal ürünler (ruhsat + MSDS). */
export async function GET() {
  const { customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const usages = await prisma.periyotBiocidalProductUsage.findMany({
    where: { occurrence: { customerId }, productId: { not: null } },
    include: {
      product: {
        select: { id: true, name: true, licenseFileDataUrl: true, licenseFileName: true, msdsFileDataUrl: true, msdsFileName: true },
      },
    },
  });

  const seen = new Map<string, (typeof usages)[number]["product"]>();
  for (const usage of usages) {
    if (usage.product && !seen.has(usage.product.id)) {
      seen.set(usage.product.id, usage.product);
    }
  }

  return NextResponse.json({ products: Array.from(seen.values()) });
}
