"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ClipboardList, Printer } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { CapaSeverityBadge, CapaStatusBadge } from "@/components/audit/audit-badges";
import { formatDate } from "@/components/crm/crm-format";
import { getCapaRows } from "@/lib/audit-report-data";
import { printCapaRaporu } from "@/lib/pdf/capa-report";
import type { CapaStatus } from "@/lib/mock/audit";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: CapaStatus | "all"; label: string }[] = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "open", label: "Açık" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "resolved", label: "Çözüldü" },
  { value: "verified", label: "Doğrulandı" },
];

export function CapaReportPage() {
  const [status, setStatus] = useState<CapaStatus | "all">("all");
  const [printing, setPrinting] = useState(false);

  const rows = useMemo(() => getCapaRows({ status: status !== "all" ? status : undefined }), [status]);
  const overdueCount = rows.filter((r) => r.overdue).length;
  const criticalCount = rows.filter((r) => r.severity === "critical").length;
  const openCount = rows.filter((r) => r.status === "open" || r.status === "in_progress").length;

  async function handlePrint() {
    setPrinting(true);
    try {
      await printCapaRaporu(rows);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="flex items-center gap-2 text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
          <ClipboardList className="size-7 text-primary" />
          CAPA Durum Raporu
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Düzeltici/Önleyici Faaliyetlerin durumu, önceliği ve vade takibi — açık ve gecikmiş faaliyetleri tek bakışta görün.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="pt-4 sm:max-w-xs">
          <Label className="mb-1.5">Durum</Label>
          <Select value={status} onValueChange={(v) => setStatus((v as CapaStatus | "all") ?? "all")}>
            <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Kayıt bulunamadı" description="Seçilen duruma ait düzeltici faaliyet yok." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CrmKpiCard label="Açık Faaliyet" value={openCount} description="Aksiyon bekleyen" changePercent={-3} icon={ClipboardList} accent="blue" delay={0.05} />
            <CrmKpiCard label="Vadesi Geçen" value={overdueCount} description="Öncelikli takip" changePercent={-5} icon={AlertTriangle} accent="amber" delay={0.1} />
            <CrmKpiCard label="Kritik Önem" value={criticalCount} description="En yüksek öncelik" changePercent={-1} icon={AlertTriangle} accent="amber" delay={0.15} />
            <CrmKpiCard label="Toplam Faaliyet" value={rows.length} description="Filtrelenen kayıt" changePercent={2} icon={ClipboardList} accent="emerald" delay={0.2} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Düzeltici Faaliyetler</span>
              <Button variant="outline" size="sm" loading={printing} onClick={handlePrint}>
                <Printer className="size-3.5" />
                Yazdır / PDF
              </Button>
            </CardHeader>
            <CardContent className="min-w-0 px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlık</TableHead>
                      <TableHead className="hidden sm:table-cell">Müşteri</TableHead>
                      <TableHead>Önem</TableHead>
                      <TableHead className="hidden md:table-cell">Sorumlu</TableHead>
                      <TableHead>Vade Tarihi</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[240px] font-medium">{r.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.customerName}</TableCell>
                        <TableCell>
                          <CapaSeverityBadge severity={r.severity} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{r.responsible}</TableCell>
                        <TableCell className={cn("whitespace-nowrap", r.overdue && "font-semibold text-destructive")}>
                          {formatDate(r.dueDate)}
                          {r.overdue && " (gecikti)"}
                        </TableCell>
                        <TableCell>
                          <CapaStatusBadge status={r.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
