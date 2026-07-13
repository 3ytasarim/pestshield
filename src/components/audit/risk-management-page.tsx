"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { AlertTriangle, Plus, ShieldAlert, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { RiskLevelBadge } from "@/components/audit/audit-badges";
import { RISK_CATEGORY_LABELS, RISK_STATUS_LABELS } from "@/components/audit/audit-labels";
import { RiskForm } from "@/components/audit/risk-form";
import { getCustomerById } from "@/lib/mock/crm";
import { risks as initialRisks, riskLevel, riskScore, type Risk, type RiskStatus } from "@/lib/mock/audit";
import type { RiskFormValues } from "@/lib/validations/audit";
import { cn } from "@/lib/utils";

const CELL_STYLES: Record<string, string> = {
  low: "bg-success/10 text-success hover:bg-success/20",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20",
  critical: "bg-destructive/10 text-destructive hover:bg-destructive/20",
};

type StatusFilter = "all" | RiskStatus;

export function RiskManagementPage() {
  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedCell, setSelectedCell] = useState<{ likelihood: number; impact: number } | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const activeRisks = useMemo(() => risks.filter((r) => r.status !== "closed"), [risks]);
  const highRisks = useMemo(() => activeRisks.filter((r) => riskScore(r) >= 9), [activeRisks]);
  const avgScore = useMemo(() => {
    if (activeRisks.length === 0) return 0;
    return Math.round((activeRisks.reduce((sum, r) => sum + riskScore(r), 0) / activeRisks.length) * 10) / 10;
  }, [activeRisks]);

  const matrix = useMemo(() => {
    const grid: Risk[][][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => [] as Risk[]));
    activeRisks.forEach((r) => {
      const li = Math.min(Math.max(r.likelihood, 1), 5) - 1;
      const im = Math.min(Math.max(r.impact, 1), 5) - 1;
      grid[im][li].push(r);
    });
    return grid;
  }, [activeRisks]);

  const filtered = useMemo(() => {
    return risks
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (selectedCell && (r.likelihood !== selectedCell.likelihood || r.impact !== selectedCell.impact)) return false;
        return true;
      })
      .sort((a, b) => riskScore(b) - riskScore(a));
  }, [risks, statusFilter, selectedCell]);

  function handleCreate(values: RiskFormValues) {
    const newRisk: Risk = {
      id: `risk-${Date.now()}`,
      title: values.title,
      category: values.category,
      description: values.description,
      likelihood: values.likelihood,
      impact: values.impact,
      mitigation: values.mitigation,
      owner: values.owner,
      status: "open",
      reviewDate: new Date().toISOString().slice(0, 10),
      customerId: values.customerId === "none" ? null : values.customerId,
    };
    setRisks((prev) => [newRisk, ...prev]);
    toast.success("Risk kaydı oluşturuldu");
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Risk Yönetimi</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Olasılık × etki matrisi ile risk kaydı ve önlem takibi.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni Risk Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Aktif Risk" value={activeRisks.length} description="Açık veya önlem alınıyor" changePercent={activeRisks.length > 0 ? 8 : -8} icon={ShieldAlert} accent="blue" delay={0.05} />
        <CrmKpiCard label="Yüksek / Kritik Risk" value={highRisks.length} description="Skoru 9 ve üzeri" changePercent={highRisks.length > 0 ? 16 : -16} icon={AlertTriangle} accent="amber" delay={0.1} />
        <CrmKpiCard label="Ortalama Risk Skoru" value={avgScore} description="Aktif risklerin ortalaması (1-25)" changePercent={4} icon={TrendingUp} accent="emerald" delay={0.15} />
      </div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Risk Matrisi (Olasılık × Etki)</p>
            {selectedCell && (
              <button type="button" onClick={() => setSelectedCell(null)} className="text-xs font-medium text-primary hover:underline">
                Filtreyi Temizle
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-between py-1 text-[10px] font-semibold text-muted-foreground">
              {[5, 4, 3, 2, 1].map((n) => (
                <div key={n} className="flex h-14 items-center sm:h-16">
                  {n}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1.5">
                {[5, 4, 3, 2, 1].map((impact) =>
                  [1, 2, 3, 4, 5].map((likelihood) => {
                    const cellRisks = matrix[impact - 1][likelihood - 1];
                    const score = likelihood * impact;
                    const level = riskLevel(score);
                    const isSelected = selectedCell?.likelihood === likelihood && selectedCell?.impact === impact;
                    return (
                      <button
                        key={`${impact}-${likelihood}`}
                        type="button"
                        onClick={() => setSelectedCell(isSelected ? null : { likelihood, impact })}
                        className={cn(
                          "flex h-14 flex-col items-center justify-center rounded-lg text-sm font-bold transition-all sm:h-16",
                          CELL_STYLES[level],
                          isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                        )}
                      >
                        {cellRisks.length > 0 ? cellRisks.length : ""}
                      </button>
                    );
                  }),
                )}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-1.5 text-center text-[10px] font-semibold text-muted-foreground">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span>← Olasılık →</span>
            <span className="text-muted-foreground/50">|</span>
            <span>↑ Etki (soldan sağa, alttan üste artar)</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { value: "all", label: "Tümü" },
            { value: "open", label: "Açık" },
            { value: "mitigating", label: "Önlem Alınıyor" },
            { value: "closed", label: "Kapandı" },
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

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Risk bulunamadı" description="Seçili filtrelere uyan risk kaydı yok." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((risk, index) => {
            const customer = risk.customerId ? getCustomerById(risk.customerId) : null;
            return (
              <motion.div
                key={risk.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className={cn(GLASS_CARD, "rounded-2xl")}>
                  <CardContent className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{risk.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {RISK_CATEGORY_LABELS[risk.category]}
                          {customer && (
                            <>
                              {" · "}
                              <Link href={`/dashboard/client/customers/${customer.id}`} className="hover:text-primary hover:underline">
                                {customer.companyName}
                              </Link>
                            </>
                          )}
                          {" · "}
                          {RISK_STATUS_LABELS[risk.status]}
                        </p>
                      </div>
                      <RiskLevelBadge score={riskScore(risk)} className="shrink-0" />
                    </div>
                    <p className="text-sm text-foreground/80">{risk.description}</p>
                    <div className="rounded-xl bg-muted/30 p-3 text-xs">
                      <p className="font-semibold text-muted-foreground uppercase">Önlem</p>
                      <p className="mt-0.5 text-foreground/80">{risk.mitigation}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sorumlu: <span className="font-medium text-foreground">{risk.owner}</span> · Gözden geçirme: {formatDate(risk.reviewDate)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <RiskForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
