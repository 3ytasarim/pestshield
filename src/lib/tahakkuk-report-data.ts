// "Tahakkuk Raporları" — tüm müşteriler genelinde her periyot ziyaretinin
// tahakkuk (hakediş) durumunu tek tabloda listeler: EK-1 formu imzalanıp
// tamamlanmış mı yoksa hâlâ bekliyor mu.

import { customers } from "@/lib/mock/crm";
import { getServiceOrdersFor } from "@/lib/service-order-store";
import { getBatchesFor, getOccurrencesFor } from "@/lib/periyot-store";
import { getEk1FormFor } from "@/lib/ek1-form-store";

export type TahakkukDurumu = "tamamlandi" | "bekliyor";

export interface TahakkukRow {
  occurrenceId: string;
  batchId: string;
  serviceOrderId: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  address: string;
  city: string;
  district: string;
  periodDate: string;
  durum: TahakkukDurumu;
  recordedAt: string | null;
  biocidalProducts: string;
  hasEk1: boolean;
}

export interface TahakkukFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  durum?: TahakkukDurumu;
}

export function getTahakkukRows(filters: TahakkukFilters = {}): TahakkukRow[] {
  const rows: TahakkukRow[] = [];

  for (const customer of customers) {
    if (filters.customerId && filters.customerId !== customer.id) continue;

    for (const order of getServiceOrdersFor(customer.id)) {
      for (const batch of getBatchesFor(order.id)) {
        for (const occ of getOccurrencesFor(batch.id)) {
          if (filters.startDate && occ.periodDate < filters.startDate) continue;
          if (filters.endDate && occ.periodDate > filters.endDate) continue;

          const ek1 = getEk1FormFor(occ.id);
          const durum: TahakkukDurumu = ek1 ? "tamamlandi" : "bekliyor";
          if (filters.durum && filters.durum !== durum) continue;

          rows.push({
            occurrenceId: occ.id,
            batchId: batch.id,
            serviceOrderId: order.id,
            customerId: customer.id,
            customerName: customer.companyName,
            serviceName: order.description,
            address: customer.addressLine,
            city: customer.city,
            district: customer.district,
            periodDate: occ.periodDate,
            durum,
            recordedAt: ek1?.updatedAt ?? null,
            biocidalProducts: occ.biocidalProducts || "—",
            hasEk1: !!ek1,
          });
        }
      }
    }
  }

  return rows.sort((a, b) => (a.periodDate < b.periodDate ? 1 : -1));
}
