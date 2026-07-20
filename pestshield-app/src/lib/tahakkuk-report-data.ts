// "Tahakkuk Raporları" — tüm müşteriler genelinde her periyot ziyaretinin
// tahakkuk (hakediş) durumunu tek tabloda listeler: EK-1 formu imzalanıp
// tamamlanmış mı yoksa hâlâ bekliyor mu. Sunucu tarafı (Prisma) sorgusudur;
// istemci bileşenlerinden doğrudan içe aktarılmamalı, bkz. /api/reports/tahakkuk.

import { prisma } from "@/lib/db";
import { serializeEk1Form } from "@/lib/periyot/serialize";
import type { Ek1Form } from "@/lib/mock/crm";

export type TahakkukDurumu = "tamamlandi" | "bekliyor";

export interface TahakkukRow {
  occurrenceId: string;
  batchId: string;
  batchName: string;
  serviceOrderId: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  address: string;
  city: string;
  district: string;
  periodDate: string;
  startTime: string;
  endTime: string;
  durum: TahakkukDurumu;
  recordedAt: string | null;
  biocidalProducts: string;
  hasEk1: boolean;
  ek1Form: Ek1Form | null;
}

export interface TahakkukFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  durum?: TahakkukDurumu;
}

export async function getTahakkukRows(ownerId: string, filters: TahakkukFilters = {}): Promise<TahakkukRow[]> {
  const occurrences = await prisma.periyotOccurrence.findMany({
    where: {
      ownerId,
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.startDate ? { periodDate: { gte: filters.startDate } } : {}),
      ...(filters.endDate ? { periodDate: { lte: filters.endDate } } : {}),
    },
    include: {
      customer: { select: { id: true, companyName: true, addressLine: true, city: true, district: true } },
      batch: { select: { id: true, name: true } },
      serviceOrder: { select: { id: true, description: true } },
      ek1Form: true,
    },
    orderBy: { periodDate: "desc" },
  });

  const rows = occurrences.map((occ): TahakkukRow => {
    const durum: TahakkukDurumu = occ.ek1Form ? "tamamlandi" : "bekliyor";
    return {
      occurrenceId: occ.id,
      batchId: occ.batchId,
      batchName: occ.batch.name,
      serviceOrderId: occ.serviceOrderId,
      customerId: occ.customerId,
      customerName: occ.customer.companyName,
      serviceName: occ.serviceOrder.description || occ.batch.name,
      address: occ.customer.addressLine,
      city: occ.customer.city,
      district: occ.customer.district,
      periodDate: occ.periodDate,
      startTime: occ.startTime,
      endTime: occ.endTime,
      durum,
      recordedAt: occ.ek1Form?.updatedAt ?? null,
      biocidalProducts: occ.biocidalProducts || "—",
      hasEk1: !!occ.ek1Form,
      ek1Form: occ.ek1Form ? serializeEk1Form(occ.ek1Form) : null,
    };
  });

  return filters.durum ? rows.filter((r) => r.durum === filters.durum) : rows;
}
