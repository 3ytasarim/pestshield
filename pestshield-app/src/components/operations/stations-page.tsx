"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPinned, Search } from "lucide-react";
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
import { Combobox, ComboboxInput, ComboboxContent, ComboboxItem } from "@/components/ui/combobox";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { KROKI_STATION_TYPES, stationColor, stationLabel } from "@/components/crm/kroki-constants";
import type { KrokiStationType } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface StationRow {
  id: string;
  type: KrokiStationType;
  number: number | null;
  stationId: string;
  sketchName: string;
  serviceName: string;
  customer: { id: string; companyName: string } | null;
}

export function StationsPage({
  initialStations,
  customers,
}: {
  initialStations: StationRow[];
  customers: { id: string; companyName: string }[];
}) {
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<KrokiStationType | "all">("all");

  const customerItems = useMemo(
    () => [{ value: "all", label: "Tüm Müşteriler" }, ...customers.map((c) => ({ value: c.id, label: c.companyName }))],
    [customers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialStations.filter((s) => {
      if (customerId !== "all" && s.customer?.id !== customerId) return false;
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (
        q &&
        !s.stationId.toLowerCase().includes(q) &&
        !s.customer?.companyName.toLowerCase().includes(q) &&
        !s.sketchName.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [initialStations, search, customerId, typeFilter]);

  const countByType = useMemo(() => {
    const map = new Map<KrokiStationType, number>();
    for (const s of initialStations) map.set(s.type, (map.get(s.type) ?? 0) + 1);
    return map;
  }, [initialStations]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">İstasyonlar</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Müşteri hizmetlerindeki krokilere yerleştirilen tüm istasyonların tam envanteri. Yeni istasyon eklemek için ilgili
          müşterinin Hizmetler &gt; Kroki ekranını kullanın.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CrmKpiCard label="Toplam İstasyon" value={initialStations.length} description="Tüm müşteriler genelinde" changePercent={5} icon={MapPinned} accent="blue" delay={0.05} />
        {KROKI_STATION_TYPES.map((t, i) => (
          <CrmKpiCard
            key={t.value}
            label={t.label}
            value={countByType.get(t.value) ?? 0}
            description="Kategoriye göre"
            changePercent={2}
            icon={MapPinned}
            accent="emerald"
            delay={0.1 + i * 0.05}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İstasyon, müşteri veya kroki ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="w-full sm:w-56">
          <Combobox
            items={customerItems}
            value={customerItems.find((c) => c.value === customerId) ?? null}
            onValueChange={(selected) => setCustomerId(selected?.value ?? "all")}
          >
            <ComboboxInput placeholder="Müşteri ara…" className="h-11 rounded-xl px-3.5 pl-8" />
            <ComboboxContent>
              {(option: { value: string; label: string }) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              typeFilter === "all" ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            Tümü
          </button>
          {KROKI_STATION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                typeFilter === t.value ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="size-2.5 rounded-full" style={{ background: t.color }} />
              {t.label}
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
                  <TableHead>Kategori</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden md:table-cell">Hizmet</TableHead>
                  <TableHead className="hidden lg:table-cell">Kroki</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.stationId || (s.number != null ? `İstasyon ${s.number}` : "—")}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: `${stationColor(s.type)}1a`, color: stationColor(s.type) }}
                      >
                        <span className="size-2 rounded-full" style={{ background: stationColor(s.type) }} />
                        {stationLabel(s.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.customer ? (
                        <Link href={`/dashboard/client/customers/${s.customer.id}`} className="hover:text-primary hover:underline">
                          {s.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{s.serviceName || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{s.sketchName}</TableCell>
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
