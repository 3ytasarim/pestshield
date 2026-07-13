// "Biyosidal Ürün Kullanım Raporu" — BRC/HACCP denetimlerinde istenen pestisit
// uygulama günlüğü: bir müşterinin tüm periyot ziyaretlerinde kullanılan
// biyosidal ürünlerin tarih sıralı kaydı.

import { loadServiceOrders } from "@/lib/service-order-store";
import { getBatchesFor, getOccurrencesFor } from "@/lib/periyot-store";

export interface ChemicalUsageRow {
  occurrenceId: string;
  serviceOrderId: string;
  serviceName: string;
  batchName: string;
  date: string;
  personnelName: string;
  products: string;
}

export function getChemicalUsageRows(customerId: string, options: { startDate?: string; endDate?: string } = {}): ChemicalUsageRow[] {
  const orders = loadServiceOrders().filter((o) => o.customerId === customerId);
  const rows: ChemicalUsageRow[] = [];
  for (const order of orders) {
    for (const batch of getBatchesFor(order.id)) {
      for (const occ of getOccurrencesFor(batch.id)) {
        if (!occ.biocidalProducts?.trim()) continue;
        if (options.startDate && occ.periodDate < options.startDate) continue;
        if (options.endDate && occ.periodDate > options.endDate) continue;
        rows.push({
          occurrenceId: occ.id,
          serviceOrderId: order.id,
          serviceName: order.description,
          batchName: batch.name,
          date: occ.periodDate,
          personnelName: occ.personnelName,
          products: occ.biocidalProducts,
        });
      }
    }
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}
