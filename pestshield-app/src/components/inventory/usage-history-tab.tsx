"use client";

import { ArrowDownCircle, ArrowUpCircle, History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import { stockTransactions, products } from "@/lib/mock/inventory";

export function UsageHistoryTab() {
  const sorted = [...stockTransactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Henüz stok hareketi yok"
        description="Stok ekleme veya kullanım kaydedildikçe burada listelenecek."
      />
    );
  }

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
        <span className="text-sm font-semibold text-foreground">Kullanım Geçmişi</span>
        <span className="text-xs font-medium text-muted-foreground">{sorted.length} hareket</span>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead className="hidden sm:table-cell">Tür</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead className="hidden lg:table-cell">Açıklama</TableHead>
              <TableHead className="hidden md:table-cell">Kayıt Eden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((txn) => {
              const product = products.find((p) => p.id === txn.productId);
              return (
                <TableRow key={txn.id}>
                  <TableCell>{formatDate(txn.date)}</TableCell>
                  <TableCell className="font-medium">{product?.name ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {txn.type === "add" ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <ArrowUpCircle className="size-3.5" />
                        Giriş
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <ArrowDownCircle className="size-3.5" />
                        Kullanım
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {txn.type === "add" ? "+" : "-"}
                    {txn.quantity} {product ? UNIT_LABELS[product.unit] : ""}
                  </TableCell>
                  <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground lg:table-cell">
                    {txn.description || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{txn.performedBy}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
