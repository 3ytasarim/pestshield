"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Printer, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxItem } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { RiskLevelBadge } from "@/components/audit/audit-badges";
import { RISK_CATEGORY_LABELS, RISK_STATUS_LABELS } from "@/components/audit/audit-labels";
import { formatDate } from "@/components/crm/crm-format";
import { getRiskRows } from "@/lib/audit-report-data";
import { printRiskRaporu } from "@/lib/pdf/risk-report";
import type { Risk, RiskStatus } from "@/lib/mock/audit";

const STATUS_OPTIONS: { value: RiskStatus | "all"; label: string }[] = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "open", label: "Açık" },
  { value: "mitigating", label: "Önlem Alınıyor" },
  { value: "closed", label: "Kapandı" },
];

interface RiskReportPageProps {
  initialRisks: Risk[];
  customers: { id: string; companyName: string }[];
}

export function RiskReportPage({ initialRisks, customers }: RiskReportPageProps) {
  const [status, setStatus] = useState<RiskStatus | "all">("all");
  const [customerId, setCustomerId] = useState<string>("all");
  const [printing, setPrinting] = useState(false);

  const rows = useMemo(
    () =>
      getRiskRows(initialRisks, customers, {
        status: status !== "all" ? status : undefined,
        customerId: customerId !== "all" ? customerId : undefined,
      }),
    [initialRisks, customers, status, customerId],
  );

  const customerItems = useMemo(
    () => [{ value: "all", label: "Tüm Müşteriler" }, ...customers.map((c) => ({ value: c.id, label: c.companyName }))],
    [customers],
  );
  const activeCount = rows.filter((r) => r.status !== "closed").length;
  const highCount = rows.filter((r) => r.status !== "closed" && r.score >= 9).length;

  async function handlePrint() {
    setPrinting(true);
    try {
      await printRiskRaporu(rows);
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
          <ShieldAlert className="size-7 text-primary" />
          Risk Durum Raporu
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Risk kayıtlarının kategorisi, skoru ve önlem durumu — yüksek ve kritik riskleri tek bakışta görün.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3.5 pt-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5">Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus((v as RiskStatus | "all") ?? "all")}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue>{() => STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Tüm Durumlar"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">Müşteri</Label>
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
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Kayıt bulunamadı" description="Seçilen duruma ait risk kaydı yok." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <CrmKpiCard label="Aktif Risk" value={activeCount} description="Açık veya önlem alınıyor" changePercent={-3} icon={ShieldAlert} accent="blue" delay={0.05} />
            <CrmKpiCard label="Yüksek / Kritik Risk" value={highCount} description="Skoru 9 ve üzeri" changePercent={-5} icon={AlertTriangle} accent="amber" delay={0.1} />
            <CrmKpiCard label="Toplam Risk" value={rows.length} description="Filtrelenen kayıt" changePercent={2} icon={ShieldAlert} accent="emerald" delay={0.15} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Risk Kayıtları</span>
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
                      <TableHead className="hidden md:table-cell">Kategori</TableHead>
                      <TableHead>Skor</TableHead>
                      <TableHead className="hidden md:table-cell">Sorumlu</TableHead>
                      <TableHead>Gözden Geçirme</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[240px] font-medium">{r.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.customerName}</TableCell>
                        <TableCell className="hidden md:table-cell">{RISK_CATEGORY_LABELS[r.category]}</TableCell>
                        <TableCell>
                          <RiskLevelBadge score={r.score} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{r.owner}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(r.reviewDate)}</TableCell>
                        <TableCell>{RISK_STATUS_LABELS[r.status]}</TableCell>
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
