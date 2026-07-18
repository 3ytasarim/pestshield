"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, History, Search, TrendingDown, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { CategoryBadge } from "@/components/inventory/inventory-badges";
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import type { Product, StockTransaction, StockTransactionType } from "@/lib/mock/inventory";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | StockTransactionType;

export function StockMovementsPage({
  initialTransactions,
  products,
}: {
  initialTransactions: StockTransaction[];
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const enriched = useMemo(
    () =>
      initialTransactions
        .map((txn) => ({ ...txn, product: products.find((p) => p.id === txn.productId) }))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [initialTransactions, products],
  );

  const filtered = useMemo(() => {
    return enriched.filter((txn) => {
      if (typeFilter !== "all" && txn.type !== typeFilter) return false;
      if (search.trim() && !txn.product?.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [enriched, typeFilter, search]);

  const thisMonthStats = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = enriched.filter((t) => t.date.startsWith(ym));
    return {
      added: thisMonth.filter((t) => t.type === "add").length,
      used: thisMonth.filter((t) => t.type === "use").length,
    };
  }, [enriched]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Stok Hareketleri</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Tüm depolardaki stok giriş ve kullanım hareketlerinin tam kaydı.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Toplam Hareket"
          value={enriched.length}
          description="Kayıtlı tüm hareketler"
          changePercent={8}
          icon={History}
          accent="blue"
          delay={0.05}
        />
        <CrmKpiCard
          label="Bu Ay Giriş"
          value={thisMonthStats.added}
          description="Bu ay yapılan stok girişi"
          changePercent={6}
          icon={TrendingUp}
          accent="emerald"
          delay={0.1}
        />
        <CrmKpiCard
          label="Bu Ay Kullanım"
          value={thisMonthStats.used}
          description="Bu ay tüketilen stok"
          changePercent={-4}
          icon={TrendingDown}
          accent="amber"
          delay={0.15}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün adına göre ara…"
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { value: "all", label: "Tümü" },
              { value: "add", label: "Giriş" },
              { value: "use", label: "Kullanım" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTypeFilter(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                typeFilter === option.value
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={History} title="Hareket bulunamadı" description="Seçili filtrelere uyan stok hareketi yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Hareket Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                  <TableHead className="hidden md:table-cell">Tür</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead className="hidden lg:table-cell">Açıklama</TableHead>
                  <TableHead className="hidden md:table-cell">Kayıt Eden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{formatDate(txn.date)}</TableCell>
                    <TableCell className="font-medium">{txn.product?.name ?? "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {txn.product && <CategoryBadge category={txn.product.category} />}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
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
                      {txn.quantity} {txn.product ? UNIT_LABELS[txn.product.unit] : ""}
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground lg:table-cell">
                      {txn.description || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{txn.performedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
