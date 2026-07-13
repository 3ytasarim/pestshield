"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, CheckCircle2, Search, ShieldAlert } from "lucide-react";
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
import { RiskBadge, CustomerStatusBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import { getAllBranches, getCustomerById } from "@/lib/mock/crm";
import type { RiskLevel } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

type RiskFilter = "all" | RiskLevel;

export function BranchesPage() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const branches = useMemo(
    () => getAllBranches().map((b) => ({ ...b, customer: getCustomerById(b.customerId) })),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      if (riskFilter !== "all" && b.riskLevel !== riskFilter) return false;
      if (q && !b.name.toLowerCase().includes(q) && !b.customer?.companyName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [branches, search, riskFilter]);

  const activeCount = useMemo(() => branches.filter((b) => b.serviceStatus === "active").length, [branches]);
  const highRiskCount = useMemo(() => branches.filter((b) => b.riskLevel === "high" || b.riskLevel === "critical").length, [branches]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Şubeler</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Tüm müşterilere ait şubelerin tek merkezden görünümü.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Şube" value={branches.length} description="Tüm müşteriler genelinde" changePercent={6} icon={Building2} accent="blue" delay={0.05} />
        <CrmKpiCard label="Aktif Hizmet" value={activeCount} description="Aktif hizmet alan şube" changePercent={8} icon={CheckCircle2} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Yüksek Risk" value={highRiskCount} description="Yüksek veya kritik risk seviyesi" changePercent={highRiskCount > 0 ? 12 : -12} icon={ShieldAlert} accent="amber" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Şube veya müşteri ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { value: "all", label: "Tümü" },
              { value: "low", label: "Düşük" },
              { value: "medium", label: "Orta" },
              { value: "high", label: "Yüksek" },
              { value: "critical", label: "Kritik" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRiskFilter(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                riskFilter === option.value
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
        <EmptyState icon={Building2} title="Şube bulunamadı" description="Seçili filtrelere uyan şube yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Şube Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Şube Adı</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden md:table-cell">Şehir / İlçe</TableHead>
                  <TableHead className="hidden sm:table-cell">Yetkili Kişi</TableHead>
                  <TableHead className="hidden sm:table-cell">Hizmet Durumu</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="hidden lg:table-cell">Son Servis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>
                      {branch.customer ? (
                        <Link href={`/dashboard/client/customers/${branch.customer.id}`} className="hover:text-primary hover:underline">
                          {branch.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {branch.city} / {branch.district}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{branch.contactName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <CustomerStatusBadge status={branch.serviceStatus} />
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={branch.riskLevel} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(branch.lastServiceDate)}</TableCell>
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
