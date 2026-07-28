import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";
import { serializeOffer } from "@/lib/crm/serialize";

/** Müşteri portalı — sadece giriş yapan müşteriye ait teklifler (salt okunur). */
export async function GET() {
  const { ownerId, customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const offers = await prisma.offer.findMany({
    where: { ownerId, customerId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ offers: offers.map(serializeOffer) });
}
