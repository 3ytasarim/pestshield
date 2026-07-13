// Finans Raporları (Tahsilat + Alacak/Vade) için veri katmanı — mevcut
// finans mock modülünün üzerine ince bir sorgu katmanı.

import { getCustomerById } from "@/lib/mock/crm";
import {
  getAllCollections,
  getDebtorCustomers,
  invoices,
  isOverdue,
  overdueDays,
  type LedgerEntry,
} from "@/lib/mock/finance";
import type { TahsilatReportRow } from "@/lib/pdf/tahsilat-report";
import type { AlacakReportRow } from "@/lib/pdf/alacak-report";

export function getTahsilatRows(options: { startDate?: string; endDate?: string; customerId?: string } = {}): TahsilatReportRow[] {
  return getAllCollections()
    .filter((e: LedgerEntry) => !options.startDate || e.date >= options.startDate)
    .filter((e: LedgerEntry) => !options.endDate || e.date <= options.endDate)
    .filter((e: LedgerEntry) => !options.customerId || e.customerId === options.customerId)
    .map((e) => ({ ...e, customerName: getCustomerById(e.customerId)?.companyName ?? "—" }));
}

export function getAlacakRows(): AlacakReportRow[] {
  return getDebtorCustomers().map((customer) => {
    const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
    const lastInvoice = customerInvoices.sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))[0] ?? null;
    return {
      customerName: customer.companyName,
      accountCode: customer.accountCode,
      balance: customer.pendingCollection,
      isOverdue: isOverdue(customer.id),
      overdueDays: overdueDays(customer.id),
      lastInvoiceDate: lastInvoice?.issueDate ?? null,
    };
  });
}
