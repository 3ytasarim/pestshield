"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Wallet, TrendingUp, Clock, Search } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { PaymentMethodBadge } from "@/components/finance/finance-badges";
import { PAYMENT_METHOD_OPTIONS } from "@/components/finance/finance-labels";
import { getCustomerById } from "@/lib/mock/crm";
import { getAllCollections, getDebtorCustomers } from "@/lib/mock/finance";
import type { PaymentMethod } from "@/lib/mock/finance";
import { cn } from "@/lib/utils";

type MethodFilter = "all" | PaymentMethod;

export function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");

  const collections = useMemo(
    () => getAllCollections().map((entry) => ({ ...entry, customer: getCustomerById(entry.customerId) })),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections.filter((c) => {
      if (methodFilter !== "all" && c.method !== methodFilter) return false;
      if (q && !c.customer?.companyName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [collections, search, methodFilter]);

  const totalCollected = useMemo(() => collections.reduce((sum, c) => sum + c.amount, 0), [collections]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return collections.filter((c) => c.date.startsWith(ym)).reduce((sum, c) => sum + c.amount, 0);
  }, [collections]);

  const pendingTotal = useMemo(() => getDebtorCustomers().reduce((sum, c) => sum + c.pendingCollection, 0), []);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Tahsilatlar</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Tüm müşterilerden yapılan tahsilat hareketlerinin kaydı.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Toplam Tahsilat"
          value={totalCollected}
          format={(v) => formatCurrency(v)}
          description="Bugüne kadar yapılan tüm tahsilatlar"
          changePercent={10}
          icon={Wallet}
          accent="emerald"
          delay={0.05}
        />
        <CrmKpiCard
          label="Bu Ay Tahsilat"
          value={thisMonthTotal}
          format={(v) => formatCurrency(v)}
          description="Bu ay yapılan tahsilat toplamı"
          changePercent={7}
          icon={TrendingUp}
          accent="blue"
          delay={0.1}
        />
        <CrmKpiCard
          label="Bekleyen Tahsilat"
          value={pendingTotal}
          format={(v) => formatCurrency(v)}
          description="Henüz tahsil edilmemiş bakiye"
          changePercent={pendingTotal > 0 ? 12 : -12}
          icon={Clock}
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
            placeholder="Müşteri adına göre ara…"
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setMethodFilter("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              methodFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tümü
          </button>
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMethodFilter(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                methodFilter === option.value
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
        <EmptyState icon={Wallet} title="Tahsilat bulunamadı" description="Seçili filtrelere uyan tahsilat yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Tahsilat Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden lg:table-cell">Açıklama</TableHead>
                  <TableHead className="hidden sm:table-cell">Yöntem</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead className="hidden md:table-cell">Kayıt Eden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatDate(c.date)}</TableCell>
                    <TableCell className="font-medium">
                      {c.customer ? (
                        <Link href={`/dashboard/client/customers/${c.customer.id}`} className="hover:text-primary hover:underline">
                          {c.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground lg:table-cell">
                      {c.description}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{c.method && <PaymentMethodBadge method={c.method} />}</TableCell>
                    <TableCell className="font-semibold tabular-nums text-success">{formatCurrency(c.amount)}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.performedBy}</TableCell>
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
