"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ClipboardList, FileCheck, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { Ek1Dialog } from "@/components/crm/ek1-dialog";
import type { PeriyotBatch, PeriyotOccurrence } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface ServiceOrderRow {
  id: string;
  description: string;
  customer: { id: string; companyName: string } | null;
}

type OccurrenceRow = PeriyotOccurrence & { hasEk1Form: boolean };

type Step = "service" | "periods";

export function TechServicesPage({ technicianName }: { technicianName: string }) {
  const [step, setStep] = useState<Step>("service");
  const [search, setSearch] = useState("");

  const [services, setServices] = useState<ServiceOrderRow[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceOrderRow | null>(null);

  const [occurrences, setOccurrences] = useState<OccurrenceRow[]>([]);
  const [loadingOccurrences, setLoadingOccurrences] = useState(false);
  const [batch, setBatch] = useState<PeriyotBatch | null>(null);

  const [addingOpen, setAddingOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);

  const [ek1OccurrenceId, setEk1OccurrenceId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crm/service-orders/assigned")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { serviceOrders?: ServiceOrderRow[] } | null) => setServices(data?.serviceOrders ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, []);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) => s.customer?.companyName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
    );
  }, [services, search]);

  function loadOccurrences(serviceId: string) {
    setLoadingOccurrences(true);
    Promise.all([
      fetch(`/api/crm/periyot/occurrences?serviceOrderId=${serviceId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { occurrences?: OccurrenceRow[] } | null) => data?.occurrences ?? []),
      fetch(`/api/crm/periyot/batches?serviceOrderId=${serviceId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { batches?: PeriyotBatch[] } | null) => data?.batches?.[0] ?? null),
    ])
      .then(([occ, b]) => {
        setOccurrences(occ.slice().sort((a, b2) => (a.periodDate < b2.periodDate ? 1 : -1)));
        setBatch(b);
      })
      .catch(() => {
        setOccurrences([]);
        setBatch(null);
      })
      .finally(() => setLoadingOccurrences(false));
  }

  function selectService(service: ServiceOrderRow) {
    setSelectedService(service);
    setStep("periods");
    loadOccurrences(service.id);
  }

  function goBack() {
    setStep("service");
    setSelectedService(null);
    setOccurrences([]);
    setBatch(null);
    setAddingOpen(false);
  }

  async function handleCreatePeriod() {
    if (!selectedService || !batch) {
      toast.error("Bu hizmet için tanımlı bir periyot planı yok — önce ofisten periyot tanımlanmalı");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/crm/periyot/occurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batch.id,
          serviceOrderId: selectedService.id,
          customerId: selectedService.customer?.id,
          personnelName: technicianName,
          periodDate: newDate,
          startTime: "",
          endTime: "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Periyot oluşturulamadı");
        return;
      }
      const created: OccurrenceRow = { ...data.occurrence, hasEk1Form: false };
      setOccurrences((prev) => [created, ...prev]);
      setAddingOpen(false);
      toast.success("Periyot oluşturuldu");
      setEk1OccurrenceId(created.id);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center gap-2">
        {step !== "service" && (
          <button type="button" onClick={goBack} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ChevronLeft className="size-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground">{step === "service" ? "Hizmetler" : "Periyotlar"}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {step === "service" ? "Size atanmış hizmetler." : selectedService?.customer?.companyName}
          </p>
        </div>
      </div>

      {step === "service" && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri veya hizmet ara…" className="h-10 rounded-xl pl-9" />
          </div>
          <div className="flex flex-col gap-2">
            {loadingServices ? (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
                Yükleniyor…
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
                Size atanmış hizmet bulunamadı
              </div>
            ) : (
              filteredServices.map((s) => (
                <button key={s.id} type="button" onClick={() => selectService(s)} className="text-left">
                  <Card className={cn(GLASS_CARD, "rounded-xl transition-colors active:bg-muted/40")}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ClipboardList className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{s.customer?.companyName ?? "Müşteri"}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.description}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {step === "periods" && selectedService && (
        <div className="flex flex-col gap-3">
          {addingOpen ? (
            <Card className={GLASS_CARD}>
              <CardContent className="flex flex-col gap-3 py-3.5">
                <div>
                  <Label className="mb-1.5">Periyot Tarihi</Label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setAddingOpen(false)}>
                    Vazgeç
                  </Button>
                  <Button className="flex-1" loading={creating} onClick={() => void handleCreatePeriod()}>
                    Oluştur
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setAddingOpen(true)}>
              <Plus className="size-4" />
              Yeni Periyot Ekle
            </Button>
          )}

          {loadingOccurrences ? (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
              Yükleniyor…
            </div>
          ) : occurrences.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
              Henüz periyot ziyareti yok
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {occurrences.map((o) => (
                <button key={o.id} type="button" onClick={() => setEk1OccurrenceId(o.id)} className="text-left">
                  <Card className={cn(GLASS_CARD, "rounded-xl transition-colors active:bg-muted/40")}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          o.hasEk1Form ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <FileCheck className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{formatDate(o.periodDate)}</p>
                        <p className="truncate text-xs text-muted-foreground">{o.personnelName || "—"}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          o.hasEk1Form ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {o.hasEk1Form ? "EK-1 Dolu" : "EK-1 Bekliyor"}
                      </span>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Ek1Dialog
        open={!!ek1OccurrenceId}
        onOpenChange={(o) => !o && setEk1OccurrenceId(null)}
        occurrence={occurrences.find((o) => o.id === ek1OccurrenceId) ?? null}
        customerId={selectedService?.customer?.id ?? null}
        batchName={batch?.name ?? ""}
        onSaved={() => selectedService && loadOccurrences(selectedService.id)}
      />
    </div>
  );
}
