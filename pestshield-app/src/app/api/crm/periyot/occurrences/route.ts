import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { addOccurrenceSchema } from "@/lib/validations/periyot";
import { serializePeriyotOccurrence } from "@/lib/periyot/serialize";
import { todayStr } from "@/lib/date-utils";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const params = new URL(request.url).searchParams;
  const batchId = params.get("batchId");
  const customerId = params.get("customerId");
  const periodDate = params.get("periodDate");

  const occurrences = await prisma.periyotOccurrence.findMany({
    where: {
      ownerId,
      ...(batchId ? { batchId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(periodDate ? { periodDate } : {}),
    },
    include: { biocidalProductUsages: true, ek1Form: { select: { id: true } } },
    orderBy: { periodDate: "asc" },
  });
  return NextResponse.json({
    occurrences: occurrences.map((o) => ({ ...serializePeriyotOccurrence(o), hasEk1Form: !!o.ek1Form })),
  });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = addOccurrenceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const values = parsed.data;

  const batch = await prisma.periyotBatch.findFirst({ where: { id: values.batchId, ownerId } });
  if (!batch) {
    return NextResponse.json({ message: "Periyot grubu bulunamadı." }, { status: 404 });
  }

  const occurrence = await prisma.periyotOccurrence.create({
    data: {
      ownerId,
      batchId: values.batchId,
      serviceOrderId: values.serviceOrderId,
      customerId: values.customerId,
      personnelName: values.personnelName,
      periodDate: values.periodDate,
      startTime: values.startTime,
      endTime: values.endTime,
      createdAt: todayStr(),
    },
    include: { biocidalProductUsages: true },
  });
  return NextResponse.json({ occurrence: serializePeriyotOccurrence(occurrence) }, { status: 201 });
}
