import type {
  PeriyotBatch as PrismaPeriyotBatch,
  PeriyotOccurrence as PrismaPeriyotOccurrence,
  PeriyotBiocidalProductUsage as PrismaBiocidalUsage,
} from "@/generated/prisma/client";
import type { PeriyotBatch, PeriyotOccurrence, BiocidalProductUsage, PeriyotDonem } from "@/lib/mock/crm";

export function serializePeriyotBatch(batch: PrismaPeriyotBatch): PeriyotBatch {
  return {
    id: batch.id,
    serviceOrderId: batch.serviceOrderId,
    name: batch.name,
    donem: batch.donem as PeriyotDonem,
    createdAt: batch.createdAt,
  };
}

export function serializeBiocidalUsage(usage: PrismaBiocidalUsage): BiocidalProductUsage {
  return {
    id: usage.id,
    productId: usage.productId ?? "",
    productName: usage.productName,
    amount: usage.amount,
    unit: usage.unit,
  };
}

export function serializePeriyotOccurrence(
  occurrence: PrismaPeriyotOccurrence & { biocidalProductUsages?: PrismaBiocidalUsage[] },
): PeriyotOccurrence {
  return {
    id: occurrence.id,
    batchId: occurrence.batchId,
    serviceOrderId: occurrence.serviceOrderId,
    personnelName: occurrence.personnelName,
    periodDate: occurrence.periodDate,
    startTime: occurrence.startTime,
    endTime: occurrence.endTime,
    documentCount: occurrence.documentCount,
    biocidalProducts: occurrence.biocidalProducts,
    biocidalProductUsages: (occurrence.biocidalProductUsages ?? []).map(serializeBiocidalUsage),
    createdAt: occurrence.createdAt,
  };
}
