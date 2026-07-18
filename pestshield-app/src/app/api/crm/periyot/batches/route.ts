import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializePeriyotBatch } from "@/lib/periyot/serialize";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const serviceOrderId = new URL(request.url).searchParams.get("serviceOrderId");
  if (!serviceOrderId) {
    return NextResponse.json({ message: "serviceOrderId zorunludur." }, { status: 400 });
  }

  const batches = await prisma.periyotBatch.findMany({
    where: { ownerId, serviceOrderId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ batches: batches.map(serializePeriyotBatch) });
}
