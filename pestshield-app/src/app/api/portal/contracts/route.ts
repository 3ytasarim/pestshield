import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";
import { serializeContract } from "@/lib/crm/serialize";

/** Müşteri portalı — sadece oturumdaki müşterinin kendi sözleşmelerini döner. */
export async function GET() {
  const { customerId, ownerId, error } = await requireCustomerOwner();
  if (error) return error;

  const contracts = await prisma.contract.findMany({
    where: { ownerId, customerId },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ contracts: contracts.map(serializeContract) });
}
