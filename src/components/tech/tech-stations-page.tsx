"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MapPin, QrCode, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { StationStatusBadge } from "@/components/operations/operations-badges";
import { STATION_TYPE_LABELS } from "@/components/operations/operations-labels";
import { getCustomerById, customers } from "@/lib/mock/crm";
import { stations, isStationOverdue, type Station, type StationStatus } from "@/lib/mock/operations";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | StationStatus;

export function TechStationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  const activeCount = useMemo(() => stations.filter((s) => s.status === "active").length, []);
  const needsAttentionCount = useMemo(() => stations.filter((s) => s.status === "needs_attention").length, []);
  const overdueCount = useMemo(() => stations.filter(isStationOverdue).length, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stations.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (customerFilter !== "all" && s.customerId !== customerFilter) return false;
      if (q) {
        const customer = getCustomerById(s.customerId);
        const haystack = `${s.label} ${s.qrCode} ${customer?.companyName ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, statusFilter, customerFilter]);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">İstasyonlar</h1>
        <p className="text-xs text-muted-foreground">Tüm müşterilerdeki haşere kontrol istasyonları.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className={cn(GLASS_CARD, "rounded-xl p-0")}>
          <CardContent className="flex flex-col items-center gap-0.5 py-3">
            <p className="text-lg font-bold tabular-nums text-success">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card className={cn(GLASS_CARD, "rounded-xl p-0")}>
          <CardContent className="flex flex-col items-center gap-0.5 py-3">
            <p className="text-lg font-bold tabular-nums text-destructive">{needsAttentionCount}</p>
            <p className="text-[10px] text-muted-foreground">İlgi Gerekiyor</p>
          </CardContent>
        </Card>
        <Card className={cn(GLASS_CARD, "rounded-xl p-0")}>
          <CardContent className="flex flex-col items-center gap-0.5 py-3">
            <p className="text-lg font-bold tabular-nums text-foreground">{stations.length}</p>
            <p className="text-[10px] text-muted-foreground">Toplam</p>
          </CardContent>
        </Card>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="flex-1">
            <b>{overdueCount}</b> istasyonun kontrol tarihi geçti
          </span>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İstasyon no, müşteri…"
          className="h-10 rounded-xl pl-9"
        />
      </div>

      <select
        value={customerFilter}
        onChange={(e) => setCustomerFilter(e.target.value)}
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      >
        <option value="all">Tüm Müşteriler</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.companyName}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { value: "all", label: "Tümü" },
            { value: "active", label: "Aktif" },
            { value: "needs_attention", label: "İlgi Gerekiyor" },
            { value: "inactive", label: "Pasif" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
            İstasyon bulunamadı
          </div>
        ) : (
          filtered.map((station: Station) => {
            const customer = getCustomerById(station.customerId);
            const overdue = isStationOverdue(station);
            return (
              <Link key={station.id} href={`/dashboard/tech/scan?code=${station.qrCode}`}>
                <Card className={cn(GLASS_CARD, "rounded-xl transition-colors active:bg-muted/40")}>
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <QrCode className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-foreground">{station.label}</p>
                        <StationStatusBadge status={station.status} className="shrink-0 px-1.5 py-0 text-[9px]" />
                      </div>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {customer?.companyName ?? "—"}
                      </p>
                      {overdue && (
                        <p className="mt-0.5 text-[10px] font-medium text-destructive">Kontrol tarihi geçti</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {STATION_TYPE_LABELS[station.type]}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
