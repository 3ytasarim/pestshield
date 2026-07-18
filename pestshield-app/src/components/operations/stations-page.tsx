"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { AlertTriangle, MapPinned, Plus, QrCode, Search, ShieldCheck } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { StationStatusBadge } from "@/components/operations/operations-badges";
import { STATION_TYPE_LABELS } from "@/components/operations/operations-labels";
import { StationForm } from "@/components/operations/station-form";
import { isStationOverdue, type Station, type StationStatus } from "@/lib/mock/operations";
import type { StationFormValues } from "@/lib/validations/operations";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | StationStatus | "overdue";

interface StationWithCustomer extends Station {
  customer: { id: string; companyName: string } | null;
}

export function StationsPage({
  initialStations,
  customers,
}: {
  initialStations: StationWithCustomer[];
  customers: { id: string; companyName: string }[];
}) {
  const [stations, setStations] = useState<StationWithCustomer[]>(initialStations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stations.filter((s) => {
      if (statusFilter === "overdue" && !isStationOverdue(s)) return false;
      if (statusFilter !== "all" && statusFilter !== "overdue" && s.status !== statusFilter) return false;
      if (q && !s.label.toLowerCase().includes(q) && !s.customer?.companyName.toLowerCase().includes(q) && !s.qrCode.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stations, search, statusFilter]);

  const needsAttentionCount = useMemo(() => stations.filter((s) => s.status === "needs_attention").length, [stations]);
  const overdueCount = useMemo(() => stations.filter(isStationOverdue).length, [stations]);

  async function handleCreate(values: StationFormValues) {
    const res = await fetch("/api/crm/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "İstasyon eklenemedi");
      return;
    }
    const customer = customers.find((c) => c.id === values.customerId) ?? null;
    setStations((prev) => [{ ...data.station, customer }, ...prev]);
    toast.success("İstasyon eklendi");
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">İstasyonlar</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Müşteri lokasyonlarına yerleştirilen tuzak, yem istasyonu ve UV sistemlerinin tam envanteri.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni İstasyon Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam İstasyon" value={stations.length} description="Tüm müşteriler genelinde" changePercent={5} icon={MapPinned} accent="blue" delay={0.05} />
        <CrmKpiCard label="İlgi Gerekiyor" value={needsAttentionCount} description="Aktivite tespit edilen istasyonlar" changePercent={needsAttentionCount > 0 ? 14 : -14} icon={AlertTriangle} accent="amber" delay={0.1} />
        <CrmKpiCard label="Vadesi Geçen Kontrol" value={overdueCount} description="Periyodik kontrol tarihi geçmiş" changePercent={overdueCount > 0 ? 12 : -12} icon={ShieldCheck} accent="emerald" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İstasyon, müşteri veya QR kod ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { value: "all", label: "Tümü" },
              { value: "active", label: "Aktif" },
              { value: "needs_attention", label: "İlgi Gerekiyor" },
              { value: "overdue", label: "Vadesi Geçen" },
              { value: "inactive", label: "Pasif" },
            ] as const
          ).map((option) => (
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
        <EmptyState icon={MapPinned} title="İstasyon bulunamadı" description="Seçili filtrelere uyan istasyon yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">İstasyon Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İstasyon</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden sm:table-cell">Tip</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="hidden md:table-cell">Son Kontrol</TableHead>
                  <TableHead className="hidden md:table-cell">Sıradaki Kontrol</TableHead>
                  <TableHead className="hidden lg:table-cell">QR Kod</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((station) => {
                  const overdue = isStationOverdue(station);
                  return (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">{station.label}</TableCell>
                      <TableCell>
                        {station.customer ? (
                          <Link href={`/dashboard/client/customers/${station.customer.id}`} className="hover:text-primary hover:underline">
                            {station.customer.companyName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{STATION_TYPE_LABELS[station.type]}</TableCell>
                      <TableCell>
                        <StationStatusBadge status={station.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(station.lastCheckDate)}</TableCell>
                      <TableCell className={cn("hidden md:table-cell", overdue && "font-medium text-destructive")}>
                        {formatDate(station.nextCheckDue)}
                        {overdue && " (geçti)"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Link
                          href={`/dashboard/client/qr-check?station=${station.id}`}
                          className="flex items-center gap-1.5 font-mono text-xs text-primary hover:underline"
                        >
                          <QrCode className="size-3.5" />
                          {station.qrCode}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <StationForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} customers={customers} />
    </div>
  );
}
