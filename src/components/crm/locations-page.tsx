"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Search, ShieldAlert, Target } from "lucide-react";
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
import { RiskBadge } from "@/components/crm/crm-badges";
import { formatDate } from "@/components/crm/crm-format";
import { LOCATION_TYPE_LABELS } from "@/components/crm/crm-labels";
import { getAllLocations, getCustomerById } from "@/lib/mock/crm";
import type { RiskLevel } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

type RiskFilter = "all" | RiskLevel;

export function LocationsPage() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const locations = useMemo(
    () => getAllLocations().map((l) => ({ ...l, customer: getCustomerById(l.customerId) })),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return locations.filter((l) => {
      if (riskFilter !== "all" && l.riskLevel !== riskFilter) return false;
      if (q && !l.name.toLowerCase().includes(q) && !l.customer?.companyName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [locations, search, riskFilter]);

  const totalStations = useMemo(() => locations.reduce((sum, l) => sum + l.stationCount, 0), [locations]);
  const highRiskCount = useMemo(() => locations.filter((l) => l.riskLevel === "high" || l.riskLevel === "critical").length, [locations]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Lokasyonlar</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Tüm müşterilere ait pest yönetimi lokasyonlarının görünümü.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Lokasyon" value={locations.length} description="Tüm müşteriler genelinde" changePercent={6} icon={MapPin} accent="blue" delay={0.05} />
        <CrmKpiCard label="Toplam İstasyon" value={totalStations} description="Lokasyonlar genelinde izlenen istasyon" changePercent={9} icon={Target} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Yüksek Risk" value={highRiskCount} description="Yüksek veya kritik risk seviyesi" changePercent={highRiskCount > 0 ? 12 : -12} icon={ShieldAlert} accent="amber" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Lokasyon veya müşteri ara…" className="h-11 rounded-xl pl-10" />
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
        <EmptyState icon={MapPin} title="Lokasyon bulunamadı" description="Seçili filtrelere uyan lokasyon yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Lokasyon Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lokasyon Adı</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden sm:table-cell">Tip</TableHead>
                  <TableHead className="hidden lg:table-cell">Şube</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="hidden md:table-cell">İstasyon</TableHead>
                  <TableHead className="hidden lg:table-cell">Son Kontrol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>
                      {location.customer ? (
                        <Link href={`/dashboard/client/customers/${location.customer.id}`} className="hover:text-primary hover:underline">
                          {location.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{LOCATION_TYPE_LABELS[location.type]}</TableCell>
                    <TableCell className="hidden lg:table-cell">{location.branchName}</TableCell>
                    <TableCell>
                      <RiskBadge level={location.riskLevel} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{location.stationCount}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(location.lastCheckDate)}</TableCell>
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
