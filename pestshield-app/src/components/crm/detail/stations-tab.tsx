"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MapPinned, Plus, QrCode } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { StationStatusBadge } from "@/components/operations/operations-badges";
import { STATION_TYPE_LABELS } from "@/components/operations/operations-labels";
import { StationForm } from "@/components/operations/station-form";
import type { Location, Customer } from "@/lib/mock/crm";
import { isStationOverdue, type Station } from "@/lib/mock/operations";
import type { StationFormValues } from "@/lib/validations/operations";
import { cn } from "@/lib/utils";

export function StationsTab({ customerId }: { customerId: string }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/crm/stations?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => setStations(data.stations))
      .catch(() => toast.error("İstasyonlar yüklenemedi"));
    fetch(`/api/crm/locations?customerId=${customerId}`)
      .then((res) => res.json())
      .then((data) => setLocations(data.locations))
      .catch(() => toast.error("Lokasyonlar yüklenemedi"));
    fetch(`/api/crm/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => setCustomer(data.customer))
      .catch(() => toast.error("Müşteri bilgisi yüklenemedi"));
  }, [customerId]);

  async function handleSubmit(values: StationFormValues) {
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
    setStations((prev) => [data.station, ...prev]);
    toast.success("İstasyon eklendi");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">İstasyonlar</h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni İstasyon Ekle
        </Button>
      </div>

      {stations.length === 0 ? (
        <EmptyState icon={MapPinned} title="Henüz istasyon yok" description="Bu müşteriye ait tuzak/yem istasyonu ekleyin." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İstasyon</TableHead>
                <TableHead className="hidden sm:table-cell">Lokasyon</TableHead>
                <TableHead className="hidden md:table-cell">Tip</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden lg:table-cell">Son Kontrol</TableHead>
                <TableHead className="hidden lg:table-cell">Sıradaki Kontrol</TableHead>
                <TableHead>QR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => {
                const location = locations.find((l) => l.id === station.locationId);
                const overdue = isStationOverdue(station);
                return (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.label}</TableCell>
                    <TableCell className="hidden sm:table-cell">{location?.name ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{STATION_TYPE_LABELS[station.type]}</TableCell>
                    <TableCell>
                      <StationStatusBadge status={station.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(station.lastCheckDate)}</TableCell>
                    <TableCell className={cn("hidden lg:table-cell", overdue && "font-medium text-destructive")}>
                      {formatDate(station.nextCheckDue)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/client/qr-check?station=${station.id}`} className="flex items-center gap-1 text-primary hover:underline">
                        <QrCode className="size-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <StationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        customers={customer ? [{ id: customer.id, companyName: customer.companyName }] : []}
        defaultCustomerId={customerId}
      />
    </div>
  );
}
