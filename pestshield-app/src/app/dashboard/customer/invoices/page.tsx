"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/components/crm/crm-format";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LedgerRow } from "@/lib/finance/serialize";

export default function CustomerPortalInvoicesPage() {
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);

  useEffect(() => {
    fetch("/api/portal/invoices")
      .then((res) => res.json())
      .then((data) => setLedger(data.ledger))
      .catch(() => toast.error("Fatura/tahsilat kaydı yüklenemedi"));
  }, []);

  const balance = ledger && ledger.length > 0 ? ledger[ledger.length - 1].balanceAfter : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Faturalar &amp; Cari Hesap</h1>
        {ledger !== null && (
          <p className="text-sm text-muted-foreground">
            Güncel Bakiye:{" "}
            <span className={cn("font-semibold", balance > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
              {new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(balance)} ₺
            </span>
          </p>
        )}
      </div>

      {ledger === null ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : ledger.length === 0 ? (
        <EmptyState icon={Wallet} title="Kayıt bulunamadı" description="Hesabınıza ait fatura veya tahsilat kaydı yok." />
      ) : (
        <div className="rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="hidden sm:table-cell">Tür</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="hidden text-right md:table-cell">Bakiye</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{row.description}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {row.type === "debt" ? "Borç" : "Tahsilat"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      row.type === "debt" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {row.type === "debt" ? "+" : "-"}
                    {new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(row.amount)} ₺
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    {new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(row.balanceAfter)} ₺
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
