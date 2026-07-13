"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { ChecklistStatusBadge } from "@/components/audit/audit-badges";
import { CHECKLIST_STATUS_LABELS } from "@/components/audit/audit-labels";
import {
  STANDARD_DESCRIPTIONS,
  STANDARD_LABELS,
  getChecklistForStandard,
  getSectionsForStandard,
  getStandardReadiness,
  type ChecklistItem,
  type ChecklistStatus,
  type ComplianceStandard,
} from "@/lib/mock/audit";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ChecklistStatus;

const STATUS_OPTIONS: { value: ChecklistStatus; label: string }[] = [
  { value: "compliant", label: "Uygun" },
  { value: "non_compliant", label: "Uygunsuz" },
  { value: "pending", label: "İnceleniyor" },
  { value: "not_applicable", label: "Kapsam Dışı" },
];

function readinessTone(score: number): { label: string; className: string; icon: typeof ShieldCheck } {
  if (score >= 90) return { label: "Denetime Hazır", className: "text-success bg-success/10 border-success/20", icon: ShieldCheck };
  if (score >= 70) return { label: "Gözden Geçirilmeli", className: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20", icon: ShieldAlert };
  return { label: "Kritik Aksiyon Gerekli", className: "text-destructive bg-destructive/10 border-destructive/20", icon: ShieldAlert };
}

interface StandardCompliancePageProps {
  standard: ComplianceStandard;
}

export function StandardCompliancePage({ standard }: StandardCompliancePageProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() => getChecklistForStandard(standard));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(getSectionsForStandard(standard).map((s) => [s.code, true])),
  );

  const sections = useMemo(() => getSectionsForStandard(standard), [standard]);

  const readiness = useMemo(() => getStandardReadiness(standard, items), [standard, items]);
  const tone = readinessTone(readiness);

  const counts = useMemo(
    () => ({
      compliant: items.filter((i) => i.status === "compliant").length,
      non_compliant: items.filter((i) => i.status === "non_compliant").length,
      pending: items.filter((i) => i.status === "pending").length,
      not_applicable: items.filter((i) => i.status === "not_applicable").length,
    }),
    [items],
  );

  function updateStatus(itemId: string, status: ChecklistStatus) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status } : i)));
    toast.success("Madde durumu güncellendi");
  }

  function sectionItems(sectionCode: string) {
    return items
      .filter((i) => i.sectionCode === sectionCode)
      .filter((i) => statusFilter === "all" || i.status === statusFilter);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">{STANDARD_LABELS[standard]}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">{STANDARD_DESCRIPTIONS[standard]}</p>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-muted">
              <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(readiness / 100) * 97.4} 97.4`}
                  className={readiness >= 90 ? "text-success" : readiness >= 70 ? "text-amber-500" : "text-destructive"}
                />
              </svg>
              <span className="absolute text-sm font-bold tabular-nums">%{readiness}</span>
            </div>
            <div>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", tone.className)}>
                <tone.icon className="size-3.5" />
                {tone.label}
              </span>
              <p className="mt-1.5 text-xs text-muted-foreground">{items.length} madde üzerinden hesaplandı</p>
            </div>
          </div>
          <Award className="size-8 text-muted-foreground/30" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <CrmKpiCard label="Uygun" value={counts.compliant} description="Uyumluluk sağlanan madde" changePercent={8} icon={CheckCircle2} accent="emerald" delay={0.05} />
        <CrmKpiCard label="Uygunsuz" value={counts.non_compliant} description="Düzeltici faaliyet gerekli" changePercent={counts.non_compliant > 0 ? 14 : -14} icon={XCircle} accent="amber" delay={0.1} />
        <CrmKpiCard label="İnceleniyor" value={counts.pending} description="Değerlendirme bekleniyor" changePercent={4} icon={Clock} accent="blue" delay={0.15} />
        <CrmKpiCard label="Kapsam Dışı" value={counts.not_applicable} description="Bu tesis için geçerli değil" changePercent={0} icon={ClipboardList} accent="purple" delay={0.2} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
        >
          Tümü
        </button>
        {STATUS_OPTIONS.map((option) => (
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
            {option.label} ({counts[option.value]})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3.5">
        {sections.map((section) => {
          const visibleItems = sectionItems(section.code);
          const isOpen = openSections[section.code];
          if (statusFilter !== "all" && visibleItems.length === 0) return null;
          return (
            <Card key={section.code} className={cn(GLASS_CARD, "gap-0 overflow-hidden rounded-2xl p-0")}>
              <button
                type="button"
                onClick={() => setOpenSections((prev) => ({ ...prev, [section.code]: !prev[section.code] }))}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {section.code}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{visibleItems.length} madde</p>
                  </div>
                </div>
                <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col divide-y divide-border/60 border-t border-border/60">
                      {visibleItems.map((item) => (
                        <div key={item.id} className="flex flex-col gap-2.5 px-4 py-3.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                <span className="text-muted-foreground">{item.itemCode}</span> {item.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                            </div>
                            <ChecklistStatusBadge status={item.status} className="shrink-0" />
                          </div>
                          {item.evidenceNote && <p className="text-xs text-foreground/70 italic">"{item.evidenceNote}"</p>}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] text-muted-foreground">
                              {item.reviewedBy} · {formatDate(item.reviewDate)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => updateStatus(item.id, option.value)}
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                    item.status === option.value
                                      ? "border-primary/30 bg-primary/10 text-primary"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                                  )}
                                >
                                  {CHECKLIST_STATUS_LABELS[option.value]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
