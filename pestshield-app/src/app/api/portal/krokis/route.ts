import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";
import { serializeKrokiSketch } from "@/lib/kroki/serialize";

/** Müşteri portalı — bu müşteriye ait krokiler (salt okunur). */
export async function GET() {
  const { customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const sketches = await prisma.krokiSketch.findMany({
    where: { serviceOrder: { customerId } },
    include: { stations: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ krokiSketches: sketches.map(serializeKrokiSketch) });
}
