"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, FileSignature, Search, Wallet } from "lucide-react";
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
import { ContractStatusBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import type { Contract, ContractStatus } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ContractStatus;

export interface ContractWithCustomer extends Contract {
  customer: { id: string; companyName: string } | null;
}

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "expiring", label: "Yakında Bitiyor" },
  { value: "expired", label: "Süresi Doldu" },
  { value: "cancelled", label: "İptal Edildi" },
];

export function ContractsPage({ initialContracts }: { initialContracts: ContractWithCustomer[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const contracts = initialContracts;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (q && !c.contractNo.toLowerCase().includes(q) && !c.customer?.companyName.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.remainingDays - b.remainingDays);
  }, [contracts, search, statusFilter]);

  const activeMonthlyTotal = useMemo(
    () => contracts.filter((c) => c.status === "active" || c.status === "expiring").reduce((sum, c) => sum + c.monthlyAmount, 0),
    [contracts],
  );
  const expiringCount = useMemo(() => contracts.filter((c) => c.status === "expiring").length, [contracts]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Sözleşmeler</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Tüm müşteri sözleşmelerinin tek merkezden takibi.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Sözleşme" value={contracts.length} description="Tüm müşteriler genelinde" changePercent={5} icon={FileSignature} accent="blue" delay={0.05} />
        <CrmKpiCard label="Aktif Aylık Gelir" value={activeMonthlyTotal} format={(v) => formatCurrency(v)} description="Aktif sözleşmelerin aylık toplamı" changePercent={8} icon={Wallet} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Yakında Bitecek" value={expiringCount} description="30 gün içinde sona erecek" changePercent={expiringCount > 0 ? 14 : -14} icon={AlertTriangle} accent="amber" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sözleşme no veya müşteri ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tümü
          </button>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                statusFilter === option.value
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
        <EmptyState icon={FileSignature} title="Sözleşme bulunamadı" description="Seçili filtrelere uyan sözleşme yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Sözleşme Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sözleşme No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden lg:table-cell">Hizmet Türü</TableHead>
                  <TableHead className="hidden md:table-cell">Bitiş</TableHead>
                  <TableHead className="hidden sm:table-cell">Aylık Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="hidden md:table-cell">Kalan Gün</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contractNo}</TableCell>
                    <TableCell>
                      {contract.customer ? (
                        <Link href={`/dashboard/client/customers/${contract.customer.id}`} className="hover:text-primary hover:underline">
                          {contract.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{contract.serviceType}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(contract.endDate)}</TableCell>
                    <TableCell className="hidden sm:table-cell font-semibold tabular-nums">{formatCurrency(contract.monthlyAmount, contract.currency)}</TableCell>
                    <TableCell>
                      <ContractStatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{contract.remainingDays >= 0 ? `${contract.remainingDays} gün` : "—"}</TableCell>
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
