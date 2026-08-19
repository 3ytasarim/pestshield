"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, QrCode, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { KROKI_STATION_TYPES, stationColor, stationLabel } from "@/components/crm/kroki-constants";
import type { KrokiStationType } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface CustomerRow {
  id: string;
  companyName: string;
}

interface ServiceOrderRow {
  id: string;
  description: string;
}

interface KrokiStationRow {
  id: string;
  type: KrokiStationType;
  number: number | null;
  stationId: string;
}

interface KrokiSketchRow {
  id: string;
  name: string;
  stations: KrokiStationRow[];
  serviceOrderId: string;
  serviceName: string;
}

type Step = "customer" | "sketch" | "stations";

export function TechStationsPage() {
  const [step, setStep] = useState<Step>("customer");
  const [search, setSearch] = useState("");

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  const [sketches, setSketches] = useState<KrokiSketchRow[]>([]);
  const [loadingSketches, setLoadingSketches] = useState(false);
  const [selectedSketch, setSelectedSketch] = useState<KrokiSketchRow | null>(null);

  useEffect(() => {
    fetch("/api/crm/customers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customers?: CustomerRow[] } | null) => setCustomers(data?.customers ?? []))
      .catch(() => setCustomers([]));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.companyName.toLowerCase().includes(q));
  }, [customers, search]);

  function selectCustomer(customer: CustomerRow) {
    setSelectedCustomer(customer);
    setSearch("");
    setStep("sketch");
    setLoadingSketches(true);
    fetch(`/api/crm/service-orders?customerId=${customer.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data: { serviceOrders?: ServiceOrderRow[] } | null) => {
        const orders = data?.serviceOrders ?? [];
        const lists = await Promise.all(
          orders.map((o) =>
            fetch(`/api/crm/service-orders/${o.id}/kroki-sketches`)
              .then((res) => (res.ok ? res.json() : null))
              .then((d: { krokiSketches?: { id: string; name: string; stations: KrokiStationRow[] }[] } | null) =>
                (d?.krokiSketches ?? []).map((s) => ({ ...s, serviceOrderId: o.id, serviceName: o.description })),
              )
              .catch(() => []),
          ),
        );
        setSketches(lists.flat());
      })
      .catch(() => setSketches([]))
      .finally(() => setLoadingSketches(false));
  }

  function selectSketch(sketch: KrokiSketchRow) {
    setSelectedSketch(sketch);
    setStep("stations");
  }

  function goBack() {
    if (step === "stations") {
      setStep("sketch");
      setSelectedSketch(null);
    } else if (step === "sketch") {
      setStep("customer");
      setSelectedCustomer(null);
      setSketches([]);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center gap-2">
        {step !== "customer" && (
          <button type="button" onClick={goBack} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ChevronLeft className="size-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground">
            {step === "customer" ? "Müşteri Seç" : step === "sketch" ? "Kroki Seç" : "İstasyonlar"}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {step === "customer" && "Servis yapacağınız müşteriyi arayın."}
            {step === "sketch" && selectedCustomer?.companyName}
            {step === "stations" && selectedSketch?.name}
          </p>
        </div>
      </div>

      {step === "customer" && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri ara…" className="h-10 rounded-xl pl-9" />
          </div>
          <div className="flex flex-col gap-2">
            {filteredCustomers.slice(0, 100).map((c) => (
              <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="text-left">
                <Card className={cn(GLASS_CARD, "rounded-xl transition-colors active:bg-muted/40")}>
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <span className="truncate text-sm font-medium text-foreground">{c.companyName}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </button>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
                Müşteri bulunamadı
              </div>
            )}
          </div>
        </>
      )}

      {step === "sketch" && (
        <div className="flex flex-col gap-2">
          {loadingSketches ? (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
              Yükleniyor…
            </div>
          ) : sketches.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
              Bu müşteriye ait kroki bulunamadı
            </div>
          ) : (
            sketches.map((s) => (
              <button key={s.id} type="button" onClick={() => selectSketch(s)} className="text-left">
                <Card className={cn(GLASS_CARD, "rounded-xl transition-colors active:bg-muted/40")}>
                  <CardContent className="flex items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.serviceName} · {s.stations.length} istasyon
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </button>
            ))
          )}
        </div>
      )}

      {step === "stations" && selectedSketch && (
        <div className="flex flex-col gap-2">
          {selectedSketch.stations.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
              Bu krokide henüz istasyon işaretlenmemiş
            </div>
          ) : (
            KROKI_STATION_TYPES.map((t) => {
              const stationsOfType = selectedSketch.stations.filter((s) => s.type === t.value);
              if (stationsOfType.length === 0) return null;
              return (
                <div key={t.value} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="size-2.5 rounded-full" style={{ background: t.color }} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{t.label}</span>
                  </div>
                  {stationsOfType.map((s) => (
                    <Link key={s.id} href={`/dashboard/tech/scan?stationId=${s.id}`}>
                      <Card className={cn(GLASS_CARD, "rounded-xl transition-colors active:bg-muted/40")}>
                        <CardContent className="flex items-center gap-3 py-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `${stationColor(s.type)}1a`, color: stationColor(s.type) }}
                          >
                            <MapPin className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {s.stationId || (s.number != null ? `İstasyon ${s.number}` : "İstasyon")}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{stationLabel(s.type)}</p>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                            <QrCode className="size-3" />
                            Okut
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
