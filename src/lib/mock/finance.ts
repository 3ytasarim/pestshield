// PestShield Finans mock veri katmanı. Gerçek backend henüz bağlanmadı;
// tüm veriler deterministik olarak üretilir (Math.random KULLANILMAZ -
// aksi halde server/client hydration mismatch oluşur).
//
// Müşteri bakiyeleri CRM'deki `customer.pendingCollection` alanını tek
// doğruluk kaynağı sayar — buradaki defter kayıtları o değere ulaşacak
// şekilde geriye doğru kurgulanır, böylece CRM ve Finans modülleri arasında
// çelişen rakamlar oluşmaz.

import { customers, getCustomerById, type Customer } from "@/lib/mock/crm";

export type PaymentMethod = "nakit" | "kart" | "havale";
export type LedgerEntryType = "debt" | "collection";
export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface LedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: LedgerEntryType;
  description: string;
  amount: number;
  balanceAfter: number;
  method?: PaymentMethod;
  performedBy: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  description: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  iban: string;
  currency: string;
  balance: number;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type: "in" | "out";
}

const METHOD_CYCLE: PaymentMethod[] = ["havale", "nakit", "kart"];
const PERFORMERS = ["Ahmet Yılmaz", "Elif Demir", "Mehmet Kaya"];

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

interface CustomerFinance {
  entries: LedgerEntry[];
  invoices: Invoice[];
}

/** Her müşteri için, son bakiyesi customer.pendingCollection'a eşit olacak şekilde deterministik bir defter kurgular. */
function buildFinanceForCustomer(customer: Customer, index: number): CustomerFinance {
  const baseInvoice = 2800 + index * 650;
  const method = METHOD_CYCLE[index % METHOD_CYCLE.length];
  const seq = customer.accountCode.split("-")[1] ?? pad(index + 1);
  // Not: pendingCollection>0 olan (borçlu) müşterilerin offset'leri isOverdue/overdueDays
  // hesaplarını doğrudan etkiler — sadece ödenmiş (index 0 ve 4) müşterilerin offset'i
  // "bu ay" KPI'larında görünür veri olması için yakın tarihli tutulur.
  const lastInvoiceOffset = -[8, 40, 20, 50, 5, 15, 25][index % 7];

  const entries: LedgerEntry[] = [];
  const invoices: Invoice[] = [];
  let balance = 0;
  let invoiceSeq = 0;

  function pushInvoice(offset: number, amount: number, willBePaidOffset: number | null) {
    invoiceSeq += 1;
    balance += amount;
    entries.push({
      id: `${customer.id}-ledger-${entries.length + 1}`,
      customerId: customer.id,
      date: daysFromNow(offset),
      type: "debt",
      description: "Aylık hizmet faturası",
      amount,
      balanceAfter: balance,
      performedBy: "Sistem",
    });
    const dueOffset = offset + customer.paymentTermDays;
    const isPaid = willBePaidOffset !== null;
    const status: InvoiceStatus = isPaid ? "paid" : dueOffset < 0 ? "overdue" : "pending";
    invoices.push({
      id: `${customer.id}-inv-${invoiceSeq}`,
      customerId: customer.id,
      invoiceNo: `FTR-2026-${seq}${pad(invoiceSeq)}`,
      issueDate: daysFromNow(offset),
      dueDate: daysFromNow(dueOffset),
      amount,
      status,
      description: "Aylık haşere kontrol hizmeti",
    });
  }

  function pushCollection(offset: number, amount: number) {
    balance -= amount;
    entries.push({
      id: `${customer.id}-ledger-${entries.length + 1}`,
      customerId: customer.id,
      date: daysFromNow(offset),
      type: "collection",
      description: method === "nakit" ? "Nakit tahsilat" : method === "kart" ? "Kredi kartı ile tahsilat" : "Havale ile tahsilat",
      amount,
      balanceAfter: balance,
      method,
      performedBy: PERFORMERS[index % PERFORMERS.length],
    });
  }

  // Geçmişte kapanmış iki dönem (ilişkinin güvenilirliğini gösterir)
  pushInvoice(-90, baseInvoice, -84);
  pushCollection(-84, baseInvoice);
  pushInvoice(-60, baseInvoice, -54);
  pushCollection(-54, baseInvoice);

  // Güncel açık/kapalı dönem
  if (customer.pendingCollection > 0) {
    pushInvoice(lastInvoiceOffset, customer.pendingCollection, null);
  } else {
    pushInvoice(lastInvoiceOffset, baseInvoice, lastInvoiceOffset + 5);
    pushCollection(lastInvoiceOffset + 5, baseInvoice);
  }

  return { entries, invoices };
}

const FINANCE_BY_CUSTOMER = new Map<string, CustomerFinance>(
  customers.map((customer, index) => [customer.id, buildFinanceForCustomer(customer, index)]),
);

export const ledgerEntries: LedgerEntry[] = customers.flatMap((c) => FINANCE_BY_CUSTOMER.get(c.id)?.entries ?? []);
export const invoices: Invoice[] = customers.flatMap((c) => FINANCE_BY_CUSTOMER.get(c.id)?.invoices ?? []);

export function getLedgerEntries(customerId: string): LedgerEntry[] {
  return ledgerEntries.filter((e) => e.customerId === customerId).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function getInvoicesForCustomer(customerId: string): Invoice[] {
  return invoices.filter((i) => i.customerId === customerId);
}

export function getCustomerBalance(customerId: string): number {
  return getCustomerById(customerId)?.pendingCollection ?? 0;
}

export function getBalanceStatus(customerId: string): "debtor" | "settled" {
  return getCustomerBalance(customerId) > 0 ? "debtor" : "settled";
}

/** Müşterinin en son ödenmemiş faturasının vadesi geçtiyse true döner. */
export function isOverdue(customerId: string): boolean {
  const openInvoice = invoices.find((i) => i.customerId === customerId && i.status !== "paid");
  if (!openInvoice) return false;
  return new Date(openInvoice.dueDate).getTime() < Date.now();
}

export function overdueDays(customerId: string): number {
  const openInvoice = invoices.find((i) => i.customerId === customerId && i.status !== "paid");
  if (!openInvoice) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(openInvoice.dueDate).getTime()) / 86_400_000));
}

export function getAllCollections(): LedgerEntry[] {
  return ledgerEntries.filter((e) => e.type === "collection").sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getDebtorCustomers(): Customer[] {
  return customers.filter((c) => c.pendingCollection > 0).sort((a, b) => b.pendingCollection - a.pendingCollection);
}

export function getOverdueCustomers(): Customer[] {
  return getDebtorCustomers().filter((c) => isOverdue(c.id));
}

export const bankAccounts: BankAccount[] = [
  {
    id: "bank-001",
    bankName: "Türkiye İş Bankası",
    accountName: "Kurumsal Hesap",
    iban: "TR12 0006 4000 0011 2345 6789 01",
    currency: "TRY",
    balance: 184500,
  },
  {
    id: "bank-002",
    bankName: "Garanti BBVA",
    accountName: "Tahsilat Hesabı",
    iban: "TR33 0006 2000 1234 5678 9012 34",
    currency: "TRY",
    balance: 92300,
  },
  {
    id: "bank-003",
    bankName: "Yapı Kredi",
    accountName: "POS Hesabı",
    iban: "TR55 0006 7010 0000 1122 3344 55",
    currency: "TRY",
    balance: 45800,
  },
];

const EXPENSE_SEED: { description: string; amount: number; offset: number; bankIndex: number }[] = [
  { description: "Ofis kirası", amount: 32000, offset: -28, bankIndex: 0 },
  { description: "Personel maaş ödemesi", amount: 118000, offset: -5, bankIndex: 0 },
  { description: "Kimyasal tedarikçi ödemesi — Sumitomo", amount: 24500, offset: -12, bankIndex: 1 },
  { description: "Araç yakıt gideri", amount: 8600, offset: -3, bankIndex: 2 },
  { description: "SGK ödemesi", amount: 41200, offset: -15, bankIndex: 0 },
];

function buildBankTransactions(): BankTransaction[] {
  const inflows: BankTransaction[] = getAllCollections()
    .slice(0, 12)
    .map((entry, i) => {
      const customer = getCustomerById(entry.customerId);
      const bankIndex = entry.method === "nakit" ? 1 : entry.method === "kart" ? 2 : 0;
      return {
        id: `bank-tx-in-${i + 1}`,
        bankAccountId: bankAccounts[bankIndex].id,
        date: entry.date,
        description: `${customer?.companyName ?? "Müşteri"} — tahsilat`,
        amount: entry.amount,
        type: "in" as const,
      };
    });

  const outflows: BankTransaction[] = EXPENSE_SEED.map((seed, i) => ({
    id: `bank-tx-out-${i + 1}`,
    bankAccountId: bankAccounts[seed.bankIndex].id,
    date: daysFromNow(seed.offset),
    description: seed.description,
    amount: seed.amount,
    type: "out" as const,
  }));

  return [...inflows, ...outflows].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const bankTransactions: BankTransaction[] = buildBankTransactions();

export function getTransactionsForBankAccount(bankAccountId: string): BankTransaction[] {
  return bankTransactions.filter((t) => t.bankAccountId === bankAccountId);
}
