import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { generateBatchSchema } from "@/lib/validations/periyot";
import { generatePeriyotDates, buildBatchName } from "@/lib/periyot/generate";
import { serializePeriyotBatch, serializePeriyotOccurrence } from "@/lib/periyot/serialize";
import { todayStr } from "@/lib/date-utils";

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = generateBatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const values = parsed.data;

  const serviceOrder = await prisma.serviceOrder.findFirst({ where: { id: values.serviceOrderId, ownerId } });
  if (!serviceOrder) {
    return NextResponse.json({ message: "Hizmet kaydı bulunamadı." }, { status: 404 });
  }

  const dates = generatePeriyotDates({
    startDate: values.startDate,
    endDate: values.endDate,
    dayOfMonth: values.dayOfMonth,
    donem: values.donem,
  });

  const now = todayStr();
  const { batch, occurrences } = await prisma.$transaction(async (tx) => {
    const batch = await tx.periyotBatch.create({
      data: {
        ownerId,
        serviceOrderId: values.serviceOrderId,
        name: buildBatchName(values.namePrefix, dates.length, values.donem),
        donem: values.donem,
        createdAt: now,
      },
    });

    if (dates.length > 0) {
      await tx.periyotOccurrence.createMany({
        data: dates.map((periodDate) => ({
          ownerId,
          batchId: batch.id,
          serviceOrderId: values.serviceOrderId,
          customerId: serviceOrder.customerId,
          personnelName: values.personnelName,
          periodDate,
          startTime: values.startTime,
          endTime: values.endTime,
          createdAt: now,
        })),
      });
    }

    const occurrences = await tx.periyotOccurrence.findMany({ where: { batchId: batch.id }, orderBy: { periodDate: "asc" } });
    return { batch, occurrences };
  });

  return NextResponse.json(
    { batch: serializePeriyotBatch(batch), occurrences: occurrences.map((o) => serializePeriyotOccurrence(o)) },
    { status: 201 },
  );
}
