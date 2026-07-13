"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { StandardSummaryCard } from "@/components/audit/standard-summary-card";
import { CapaSeverityBadge, CapaStatusBadge } from "@/components/audit/audit-badges";
import { AUDIT_TYPE_LABELS } from "@/components/audit/audit-labels";
import { getCustomerById } from "@/lib/mock/crm";
import {
  STANDARD_LABELS,
  correctiveActions,
  getOpenCorrectiveActions,
  getStandardReadiness,
  getUpcomingAudits,
  type ComplianceStandard,
} from "@/lib/mock/audit";
import { cn } from "@/lib/utils";

const STANDARDS: ComplianceStandard[] = ["haccp", "brcgs", "iso22000", "fssc"];

export function AuditCenterPage() {
  const overallReadiness = useMemo(
    () => Math.round(STANDARDS.reduce((sum, s) => sum + getStandardReadiness(s), 0) / STANDARDS.length),
    [],
  );
  const openCapaCount = useMemo(() => getOpenCorrectiveActions().length, []);
  const upcomingAudits = useMemo(() => getUpcomingAudits(), []);
  const recentCapas = useMemo(
    () => [...correctiveActions].sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1)).slice(0, 5),
    [],
  );

  function daysUntil(date: string) {
    return Math.round((new Date(date).getTime() - Date.now()) / 86_400_000);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Audit Center</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Tüm uyumluluk standartlarının genel görünümü, yaklaşan denetimler ve açık bulgular tek ekranda.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Genel Uyumluluk"
          value={overallReadiness}
          format={(v) => `%${Math.round(v)}`}
          description="4 standardın ortalama uyum skoru"
          changePercent={overallReadiness >= 80 ? 6 : -6}
          icon={ShieldCheck}
          accent="emerald"
          delay={0.05}
        />
        <CrmKpiCard
          label="Açık Düzeltici Faaliyet"
          value={openCapaCount}
          description="Açık veya devam eden CAPA"
          changePercent={openCapaCount > 0 ? 10 : -10}
          icon={AlertTriangle}
          accent="amber"
          delay={0.1}
        />
        <CrmKpiCard
          label="Yaklaşan Denetim"
          value={upcomingAudits.length}
          description="Planlanmış denetim sayısı"
          changePercent={4}
          icon={CalendarClock}
          accent="blue"
          delay={0.15}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Standartlar</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STANDARDS.map((standard, index) => (
            <StandardSummaryCard key={standard} standard={standard} delay={index * 0.05} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Yaklaşan Denetimler</h2>
          {upcomingAudits.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Planlanmış denetim yok" description="Şu anda takvimde bekleyen bir denetim bulunmuyor." />
          ) : (
            <Card className={cn(GLASS_CARD, "gap-0 divide-y divide-border/60 rounded-2xl p-0")}>
              {upcomingAudits.map((audit) => {
                const customer = getCustomerById(audit.customerId);
                const days = daysUntil(audit.scheduledDate);
                return (
                  <div key={audit.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {STANDARD_LABELS[audit.standard]} · {AUDIT_TYPE_LABELS[audit.type]}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer?.companyName ?? "—"} · {audit.auditor}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">{formatDate(audit.scheduledDate)}</p>
                      <p className="text-xs text-primary">{days} gün kaldı</p>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Son Düzeltici Faaliyetler</h2>
            <Link href="/dashboard/client/corrective-actions" className="text-xs font-medium text-primary hover:underline">
              Tümünü Gör
            </Link>
          </div>
          {recentCapas.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="Kayıt yok" description="Henüz düzeltici faaliyet kaydı bulunmuyor." />
          ) : (
            <Card className={cn(GLASS_CARD, "gap-0 divide-y divide-border/60 rounded-2xl p-0")}>
              {recentCapas.map((capa) => (
                <div key={capa.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{capa.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {capa.standard ? STANDARD_LABELS[capa.standard] : "Genel"} · {formatDate(capa.createdDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <CapaSeverityBadge severity={capa.severity} />
                    <CapaStatusBadge status={capa.status} />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
