"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { CHECKLIST_STATUS_LABELS } from "@/components/audit/audit-labels";
import { STANDARD_LABELS, type ChecklistItem, type ChecklistStatus } from "@/lib/mock/audit";
import { cn } from "@/lib/utils";

interface CustomerRow {
  id: string;
  companyName: string;
}

const STATUS_OPTIONS: { value: ChecklistStatus; label: string }[] = [
  { value: "compliant", label: CHECKLIST_STATUS_LABELS.compliant },
  { value: "non_compliant", label: CHECKLIST_STATUS_LABELS.non_compliant },
  { value: "pending", label: CHECKLIST_STATUS_LABELS.pending },
  { value: "not_applicable", label: CHECKLIST_STATUS_LABELS.not_applicable },
];

export function TechCompliancePage({ technicianName }: { technicianName: string }) {
  const [step, setStep] = useState<"customer" | "checklist">("customer");
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [edited, setEdited] = useState<Record<string, { status: ChecklistStatus; evidenceNote: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/crm/customers/assigned")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customers?: CustomerRow[] } | null) => setCustomers(data?.customers ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.companyName.toLowerCase().includes(q));
  }, [customers, search]);

  function selectCustomer(customer: CustomerRow) {
    setSelectedCustomer(customer);
    setStep("checklist");
    setEdited({});
    setLoadingItems(true);
    fetch(`/api/audit/checklist?customerId=${customer.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: ChecklistItem[] } | null) => setItems(data?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }

  function goBack() {
    setStep("customer");
    setSelectedCustomer(null);
    setItems([]);
    setEdited({});
  }

  function updateItem(id: string, patch: Partial<{ status: ChecklistStatus; evidenceNote: string }>) {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    setEdited((prev) => ({
      ...prev,
      [id]: {
        status: prev[id]?.status ?? current.status,
        evidenceNote: prev[id]?.evidenceNote ?? current.evidenceNote,
        ...patch,
      },
    }));
  }

  async function handleSubmit() {
    const changedIds = Object.keys(edited);
    if (changedIds.length === 0) {
      toast.info("Değişiklik yok");
      return;
    }
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const results = await Promise.all(
        changedIds.map((id) =>
          fetch(`/api/audit/checklist/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...edited[id], reviewedBy: technicianName, reviewDate: today }),
          }),
        ),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(`${failed} madde kaydedilemedi`);
      } else {
        toast.success("Uygunluk denetimi gönderildi");
        setEdited({});
        setItems((prev) => prev.map((i) => (edited[i.id] ? { ...i, ...edited[i.id] } : i)));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of items) {
      const key = `${item.standard}::${item.sectionCode}::${item.sectionTitle}`;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center gap-2">
        {step === "checklist" && (
          <button type="button" onClick={goBack} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ChevronLeft className="size-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground">{step === "customer" ? "Müşteri Seç" : "Uygunluk"}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {step === "customer" ? "Size atanmış müşteriler." : selectedCustomer?.companyName}
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
            {loadingCustomers ? (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
                Yükleniyor…
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
                Size atanmış müşteri bulunamadı
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="text-left">
                  <Card className={cn(GLASS_CARD, "rounded-xl transition-colors active:bg-muted/40")}>
                    <CardContent className="flex items-center justify-between gap-2 py-3">
                      <span className="truncate text-sm font-medium text-foreground">{c.companyName}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {step === "checklist" && (
        <div className="flex flex-col gap-4">
          {loadingItems ? (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
              Yükleniyor…
            </div>
          ) : (
            grouped.map(([key, sectionItems]) => {
              const [standard, sectionCode, sectionTitle] = key.split("::");
              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {STANDARD_LABELS[standard as keyof typeof STANDARD_LABELS]} · {sectionCode} — {sectionTitle}
                    </span>
                  </div>
                  {sectionItems.map((item) => {
                    const current = edited[item.id] ?? { status: item.status, evidenceNote: item.evidenceNote };
                    return (
                      <Card key={item.id} className={GLASS_CARD}>
                        <CardContent className="flex flex-col gap-2.5 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {item.itemCode} {item.title}
                          </p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          <div className="grid grid-cols-2 gap-1.5">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateItem(item.id, { status: opt.value })}
                                className={cn(
                                  "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                                  current.status === opt.value
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground",
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div>
                            <Label className="mb-1 text-xs">Kanıt Notu</Label>
                            <Textarea
                              value={current.evidenceNote}
                              onChange={(e) => updateItem(item.id, { evidenceNote: e.target.value })}
                              rows={2}
                              className="rounded-lg px-2.5 py-2 text-xs"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })
          )}

          {!loadingItems && items.length > 0 && (
            <Button onClick={() => void handleSubmit()} loading={submitting} className="sticky bottom-2">
              <ShieldCheck className="size-4" />
              Gönder ({Object.keys(edited).length} değişiklik)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
