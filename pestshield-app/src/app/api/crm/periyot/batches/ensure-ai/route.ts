import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializePeriyotBatch } from "@/lib/periyot/serialize";
import { todayStr } from "@/lib/date-utils";

const AI_BATCH_NAME = "AI ile Oluşturulan Servisler";

/** AI Command Center'ın tekil (tekrarlamayan) servis önerileri için kullandığı sabit grup — var olan bir grubu bulur ya da ilk seferinde oluşturur. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { serviceOrderId } = await request.json();
  if (!serviceOrderId) {
    return NextResponse.json({ message: "serviceOrderId zorunludur." }, { status: 400 });
  }

  const serviceOrder = await prisma.serviceOrder.findFirst({ where: { id: serviceOrderId, ownerId } });
  if (!serviceOrder) {
    return NextResponse.json({ message: "Hizmet kaydı bulunamadı." }, { status: 404 });
  }

  const existing = await prisma.periyotBatch.findFirst({ where: { ownerId, serviceOrderId, name: AI_BATCH_NAME } });
  if (existing) {
    return NextResponse.json({ batch: serializePeriyotBatch(existing) });
  }

  const batch = await prisma.periyotBatch.create({
    data: { ownerId, serviceOrderId, name: AI_BATCH_NAME, donem: "daily", createdAt: todayStr() },
  });
  return NextResponse.json({ batch: serializePeriyotBatch(batch) }, { status: 201 });
}
