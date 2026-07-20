// Finans Raporları (Tahsilat + Alacak/Vade) için veri katmanı — gerçek
// Collection/Invoice/Customer tablolarını Prisma'dan okur. İstemci
// bileşenlerinden doğrudan içe aktarılmamalı, bkz. /api/reports/tahsilat
// ve /api/reports/alacak.

import { prisma } from "@/lib/db";
import { serializeInvoice } from "@/lib/finance/serialize";
import { debtorStatus } from "@/lib/finance/serialize";
import type { TahsilatReportRow } from "@/lib/pdf/tahsilat-report";
import type { AlacakReportRow } from "@/lib/pdf/alacak-report";

export async function getTahsilatRows(
  ownerId: string,
  options: { startDate?: string; endDate?: string; customerId?: string } = {},
): Promise<TahsilatReportRow[]> {
  const collections = await prisma.collection.findMany({
    where: {
      ownerId,
      ...(options.customerId ? { customerId: options.customerId } : {}),
      ...(options.startDate ? { date: { gte: options.startDate } } : {}),
      ...(options.endDate ? { date: { lte: options.endDate } } : {}),
    },
    include: { customer: { select: { companyName: true } } },
    orderBy: { date: "desc" },
  });

  return collections.map((c) => ({
    id: c.id,
    customerId: c.customerId,
    date: c.date,
    type: "collection" as const,
    description: c.description || "Tahsilat",
    amount: Number(c.amount),
    // Bu rapor sadece tahsilatları listeler; cari hesap bakiyesi burada
    // gösterilmediği için hesaplanmıyor (bkz. computeLedger — Cari Hesap sekmesi).
    balanceAfter: 0,
    method: c.method,
    performedBy: c.performedBy,
    customerName: c.customer.companyName,
  }));
}

export async function getAlacakRows(ownerId: string): Promise<AlacakReportRow[]> {
  const debtors = await prisma.customer.findMany({
    where: { ownerId, pendingCollection: { gt: 0 } },
    orderBy: { pendingCollection: "desc" },
  });
  if (debtors.length === 0) return [];

  const invoices = await prisma.invoice.findMany({
    where: { ownerId, customerId: { in: debtors.map((d) => d.id) } },
  });
  const invoicesByCustomer = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const list = invoicesByCustomer.get(inv.customerId) ?? [];
    list.push(inv);
    invoicesByCustomer.set(inv.customerId, list);
  }
  const todayStr = new Date().toISOString().slice(0, 10);

  return debtors.map((customer) => {
    const customerInvoices = (invoicesByCustomer.get(customer.id) ?? []).map(serializeInvoice);
    const status = debtorStatus(customerInvoices, todayStr);
    const lastInvoice = [...customerInvoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))[0] ?? null;
    return {
      customerName: customer.companyName,
      accountCode: customer.accountCode,
      balance: Number(customer.pendingCollection),
      isOverdue: status.overdue,
      overdueDays: status.days,
      lastInvoiceDate: lastInvoice?.issueDate ?? null,
    };
  });
}
