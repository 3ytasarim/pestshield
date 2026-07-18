"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Plus, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrentAccountSummary } from "@/components/crm/detail/current-account-summary";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { TRANSACTION_TYPE_LABELS } from "@/components/crm/crm-labels";
import { printCurrentAccountStatement } from "@/components/finance/print-statement";
import { computeLedger, type SerializedCollection } from "@/lib/finance/serialize";
import type { Invoice } from "@/lib/mock/finance";
import type { Customer } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface AccountRow {
  id: string;
  date: string;
  type: "invoice" | "collection";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: "completed" | "pending";
}

export function CurrentAccountTab({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [collections, setCollections] = useState<SerializedCollection[]>([]);

  useEffect(() => {
    fetch(`/api/crm/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => setCustomer(data.customer))
      .catch(() => setCustomer(null));
    fetch(`/api/finance/invoices?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => setInvoices(data.invoices))
      .catch(() => setInvoices([]));
    fetch(`/api/finance/collections?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => setCollections(data.collections))
      .catch(() => setCollections([]));
  }, [customerId]);

  const invoiceStatusById = useMemo(() => new Map(invoices.map((i) => [i.id, i.status])), [invoices]);

  const transactions: AccountRow[] = useMemo(
    () =>
      computeLedger(invoices, collections).map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type === "debt" ? "invoice" : "collection",
        description: e.description,
        debit: e.type === "debt" ? e.amount : 0,
        credit: e.type === "collection" ? e.amount : 0,
        balance: e.balanceAfter,
        status: e.type === "debt" && invoiceStatusById.get(e.id) !== "paid" ? "pending" : "completed",
      })),
    [invoices, collections, invoiceStatusById],
  );

  function handlePrint() {
    if (!customer) return;
    printCurrentAccountStatement(customer, computeLedger(invoices, collections), customer.pendingCollection);
  }

  const summary = useMemo(() => {
    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);
    const pendingCollection = transactions.filter((t) => t.status === "pending").reduce((sum, t) => sum + t.debit, 0);
    const lastPayment = [...transactions].reverse().find((t) => t.type === "collection");
    return {
      totalDebit,
      totalCredit,
      pendingCollection,
      overdueAmount: pendingCollection,
      lastPaymentDate: lastPayment?.date ?? null,
    };
  }, [transactions]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cari Hesap</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Tahsilat kaydedildi")}>
            <Plus className="size-3.5" />
            Tahsilat Ekle
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Fatura oluşturuldu")}>
            <FileText className="size-3.5" />
            Fatura Oluştur
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Cari ekstre indirme yakında eklenecek")}>
            <Download className="size-3.5" />
            Cari Ekstre İndir
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <FileText className="size-3.5" />
            PDF Oluştur
          </Button>
        </div>
      </div>

      <CurrentAccountSummary {...summary} />

      <div className="rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead className="hidden sm:table-cell">İşlem Tipi</TableHead>
              <TableHead className="hidden lg:table-cell">Açıklama</TableHead>
              <TableHead className="hidden md:table-cell">Borç</TableHead>
              <TableHead className="hidden md:table-cell">Alacak</TableHead>
              <TableHead>Bakiye</TableHead>
              <TableHead className="hidden lg:table-cell">Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{formatDate(tx.date)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className="rounded-full">
                    {TRANSACTION_TYPE_LABELS[tx.type]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{tx.description}</TableCell>
                <TableCell className={cn("hidden md:table-cell", tx.debit > 0 ? "text-destructive" : "text-muted-foreground")}>
                  {tx.debit > 0 ? formatCurrency(tx.debit) : "—"}
                </TableCell>
                <TableCell className={cn("hidden md:table-cell", tx.credit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                  {tx.credit > 0 ? formatCurrency(tx.credit) : "—"}
                </TableCell>
                <TableCell className="font-medium tabular-nums">{formatCurrency(tx.balance)}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge
                    variant="outline"
                    className={
                      tx.status === "pending"
                        ? "rounded-full border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    }
                  >
                    {tx.status === "pending" ? "Bekliyor" : "Tamamlandı"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Wallet className="size-8" />
          <p>Cari hesap hareketi bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
