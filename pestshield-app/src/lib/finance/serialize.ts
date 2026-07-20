import type {
  Invoice as PrismaInvoice,
  Collection as PrismaCollection,
  BankAccount as PrismaBankAccount,
  BankTransaction as PrismaBankTransaction,
} from "@/generated/prisma";
import type { Invoice, PaymentMethod, InvoiceStatus, BankAccount, BankTransaction } from "@/lib/mock/finance";

export function serializeInvoice(invoice: PrismaInvoice): Invoice {
  const { ownerId: _ownerId, ...rest } = invoice;
  void _ownerId;
  return { ...rest, amount: Number(invoice.amount), status: invoice.status as InvoiceStatus };
}

export interface SerializedCollection {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  description: string;
  performedBy: string;
}

export function serializeCollection(collection: PrismaCollection): SerializedCollection {
  const { ownerId: _ownerId, ...rest } = collection;
  void _ownerId;
  return { ...rest, amount: Number(collection.amount), method: collection.method as PaymentMethod };
}

export function serializeBankAccount(account: PrismaBankAccount): BankAccount {
  const { ownerId: _ownerId, ...rest } = account;
  void _ownerId;
  return { ...rest, balance: Number(account.balance) };
}

export function serializeBankTransaction(tx: PrismaBankTransaction): BankTransaction {
  const { ownerId: _ownerId, ...rest } = tx;
  void _ownerId;
  return { ...rest, amount: Number(tx.amount), type: tx.type === "inflow" ? "in" : "out" };
}

/** Cari Hesap defteri — Invoice (borç) + Collection (tahsilat) birleştirilip tarihe göre sıralanır, bakiye tarihe göre birikimli hesaplanır. */
export interface LedgerRow {
  id: string;
  customerId: string;
  date: string;
  type: "debt" | "collection";
  description: string;
  amount: number;
  balanceAfter: number;
  method?: PaymentMethod;
  performedBy: string;
}

export function computeLedger(invoices: Invoice[], collections: SerializedCollection[]): LedgerRow[] {
  const events: Omit<LedgerRow, "balanceAfter">[] = [
    ...invoices.map((inv) => ({
      id: inv.id,
      customerId: inv.customerId,
      date: inv.issueDate,
      type: "debt" as const,
      description: inv.description || `Fatura ${inv.invoiceNo}`,
      amount: inv.amount,
      performedBy: "Sistem",
    })),
    ...collections.map((c) => ({
      id: c.id,
      customerId: c.customerId,
      date: c.date,
      type: "collection" as const,
      description: c.description || "Tahsilat",
      amount: c.amount,
      method: c.method,
      performedBy: c.performedBy || "Sistem",
    })),
  ];
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let running = 0;
  return events.map((e) => {
    running += e.type === "debt" ? e.amount : -e.amount;
    return { ...e, balanceAfter: running };
  });
}

/** Bir müşterinin en eski ödenmemiş faturasına göre vade durumu (mock'taki isOverdue/overdueDays karşılığı). */
export function debtorStatus(
  invoices: Pick<Invoice, "dueDate" | "status">[],
  todayStr: string,
): { overdue: boolean; days: number; dueDate: string | null } {
  const unpaid = [...invoices].filter((i) => i.status !== "paid").sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  const oldest = unpaid[0];
  if (!oldest) return { overdue: false, days: 0, dueDate: null };
  const overdue = oldest.dueDate < todayStr;
  const days = overdue ? Math.floor((new Date(todayStr).getTime() - new Date(oldest.dueDate).getTime()) / 86_400_000) : 0;
  return { overdue, days, dueDate: oldest.dueDate };
}
