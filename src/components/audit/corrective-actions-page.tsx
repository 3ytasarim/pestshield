"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { AlertOctagon, CheckCircle2, ClipboardCheck, Clock, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { CapaSeverityBadge, CapaStatusBadge } from "@/components/audit/audit-badges";
import { CAPA_SEVERITY_OPTIONS, CAPA_SOURCE_LABELS } from "@/components/audit/audit-labels";
import { CapaForm } from "@/components/audit/capa-form";
import { getCustomerById } from "@/lib/mock/crm";
import {
  STANDARD_LABELS,
  correctiveActions as initialCapas,
  isCapaOverdue,
  type CapaSeverity,
  type CapaStatus,
  type CorrectiveAction,
} from "@/lib/mock/audit";
import type { CapaFormValues } from "@/lib/validations/audit";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | CapaStatus;
type SeverityFilter = "all" | CapaSeverity;

const STATUS_FLOW: CapaStatus[] = ["open", "in_progress", "resolved", "verified"];
const STATUS_OPTIONS: { value: CapaStatus; label: string }[] = [
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "resolved", label: "Çözüldü" },
  { value: "verified", label: "Doğrulandı" },
];

export function CorrectiveActionsPage() {
  const [capas, setCapas] = useState<CorrectiveAction[]>(initialCapas);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return capas
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (severityFilter !== "all" && c.severity !== severityFilter) return false;
        if (q && !c.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1));
  }, [capas, search, statusFilter, severityFilter]);

  const openCount = useMemo(() => capas.filter((c) => c.status === "open").length, [capas]);
  const inProgressCount = useMemo(() => capas.filter((c) => c.status === "in_progress").length, [capas]);
  const overdueCount = useMemo(() => capas.filter(isCapaOverdue).length, [capas]);
  const closedCount = useMemo(() => capas.filter((c) => c.status === "resolved" || c.status === "verified").length, [capas]);

  function advanceStatus(id: string) {
    setCapas((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = STATUS_FLOW.indexOf(c.status);
        const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
        const resolvedDate = next === "resolved" || next === "verified" ? new Date().toISOString().slice(0, 10) : c.resolvedDate;
        return { ...c, status: next, resolvedDate };
      }),
    );
    toast.success("Durum güncellendi");
  }

  function handleCreate(values: CapaFormValues) {
    const newCapa: CorrectiveAction = {
      id: `capa-${Date.now()}`,
      title: values.title,
      standard: values.standard === "none" ? null : values.standard,
      customerId: values.customerId === "none" ? null : values.customerId,
      source: values.source,
      severity: values.severity,
      rootCause: values.rootCause,
      actionPlan: values.actionPlan,
      responsible: values.responsible,
      createdDate: new Date().toISOString().slice(0, 10),
      dueDate: values.dueDate,
      resolvedDate: null,
      status: "open",
    };
    setCapas((prev) => [newCapa, ...prev]);
    toast.success("Düzeltici faaliyet oluşturuldu");
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Düzeltici Faaliyetler</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Denetim bulguları ve uygunsuzluklar için CAPA takibi.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni Düzeltici Faaliyet
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CrmKpiCard label="Açık" value={openCount} description="Henüz başlanmamış" changePercent={openCount > 0 ? 12 : -12} icon={AlertOctagon} accent="amber" delay={0.05} />
        <CrmKpiCard label="Devam Ediyor" value={inProgressCount} description="Aksiyon planı uygulanıyor" changePercent={6} icon={Clock} accent="blue" delay={0.1} />
        <CrmKpiCard label="Vadesi Geçen" value={overdueCount} description="Termin tarihi geçmiş" changePercent={overdueCount > 0 ? 18 : -18} icon={AlertOctagon} accent="amber" delay={0.15} />
        <CrmKpiCard label="Kapanan" value={closedCount} description="Çözüldü veya doğrulandı" changePercent={9} icon={CheckCircle2} accent="emerald" delay={0.2} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Başlığa göre ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tüm Durumlar
          </button>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === option.value
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSeverityFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              severityFilter === "all" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tüm Önem Dereceleri
          </button>
          {CAPA_SEVERITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSeverityFilter(option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                severityFilter === option.value
                  ? "border-success/20 bg-success text-success-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Kayıt bulunamadı" description="Seçili filtrelere uyan düzeltici faaliyet yok." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((capa, index) => {
            const customer = capa.customerId ? getCustomerById(capa.customerId) : null;
            const overdue = isCapaOverdue(capa);
            const isDone = capa.status === "resolved" || capa.status === "verified";
            return (
              <motion.div
                key={capa.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card
                  className={cn(
                    GLASS_CARD,
                    "rounded-2xl border-l-4",
                    overdue ? "border-l-destructive" : isDone ? "border-l-success" : "border-l-amber-500",
                  )}
                >
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{capa.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {capa.standard ? STANDARD_LABELS[capa.standard] : "Genel"}
                          {customer && (
                            <>
                              {" · "}
                              <Link href={`/dashboard/client/customers/${customer.id}`} className="hover:text-primary hover:underline">
                                {customer.companyName}
                              </Link>
                            </>
                          )}
                          {" · "}
                          {CAPA_SOURCE_LABELS[capa.source]}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <CapaSeverityBadge severity={capa.severity} />
                        <CapaStatusBadge status={capa.status} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 rounded-xl bg-muted/30 p-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="font-semibold text-muted-foreground uppercase">Kök Neden</p>
                        <p className="mt-0.5 text-foreground/80">{capa.rootCause}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-muted-foreground uppercase">Aksiyon Planı</p>
                        <p className="mt-0.5 text-foreground/80">{capa.actionPlan}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Sorumlu: <span className="font-medium text-foreground">{capa.responsible}</span> · Vade:{" "}
                        <span className={cn("font-medium", overdue ? "text-destructive" : "text-foreground")}>{formatDate(capa.dueDate)}</span>
                        {capa.resolvedDate && <> · Çözüm: {formatDate(capa.resolvedDate)}</>}
                      </p>
                      {!isDone && (
                        <Button size="sm" variant="outline" onClick={() => advanceStatus(capa.id)}>
                          Sonraki Aşamaya Geçir
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <CapaForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
