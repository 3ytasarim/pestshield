"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Printer, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { ChecklistStatusBadge } from "@/components/audit/audit-badges";
import { formatDate } from "@/components/crm/crm-format";
import { countByStatus, getUygunlukRows, uygunlukOrani, STANDARD_LABELS } from "@/lib/audit-report-data";
import { printUygunlukRaporu } from "@/lib/pdf/uygunluk-report";
import type { ChecklistItem, ComplianceStandard } from "@/lib/mock/audit";

interface UygunlukReportPageProps {
  initialItems: ChecklistItem[];
}

export function UygunlukReportPage({ initialItems }: UygunlukReportPageProps) {
  const [standard, setStandard] = useState<ComplianceStandard | "all">("all");
  const [printing, setPrinting] = useState(false);

  const rows = useMemo(
    () => getUygunlukRows(initialItems, { standard: standard !== "all" ? standard : undefined }),
    [initialItems, standard],
  );
  const ratio = uygunlukOrani(rows);
  const nonCompliant = countByStatus(rows, "non_compliant");
  const pending = countByStatus(rows, "pending");
  const standardLabel = standard === "all" ? "Tüm Standartlar" : STANDARD_LABELS[standard];

  async function handlePrint() {
    setPrinting(true);
    try {
      await printUygunlukRaporu(rows, standardLabel, ratio);
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
          <ShieldCheck className="size-7 text-primary" />
          Uygunluk Durum Raporu
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          HACCP, BRCGS, ISO 22000 ve FSSC 22000 checklist maddelerinin standart bazında uygunluk durumu.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="pt-4 sm:max-w-xs">
          <Label className="mb-1.5">Standart</Label>
          <Select value={standard} onValueChange={(v) => setStandard((v as ComplianceStandard | "all") ?? "all")}>
            <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Standartlar</SelectItem>
              {(Object.keys(STANDARD_LABELS) as ComplianceStandard[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STANDARD_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Kayıt bulunamadı" description="Seçilen standarda ait checklist maddesi yok." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CrmKpiCard label="Uygunluk Oranı" value={ratio} format={(v) => `%${v}`} description="Uygulanabilir maddeler" changePercent={3} icon={ShieldCheck} accent="emerald" delay={0.05} />
            <CrmKpiCard label="Uygunsuz Madde" value={nonCompliant} description="Acil aksiyon gerekli" changePercent={-2} icon={ShieldCheck} accent="amber" delay={0.1} />
            <CrmKpiCard label="İnceleniyor" value={pending} description="Bir sonraki denetimde" changePercent={1} icon={ShieldCheck} accent="blue" delay={0.15} />
            <CrmKpiCard label="Toplam Madde" value={rows.length} description="Değerlendirilen madde" changePercent={2} icon={ShieldCheck} accent="blue" delay={0.2} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Checklist Maddeleri</span>
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
                      <TableHead>Standart</TableHead>
                      <TableHead className="hidden sm:table-cell">Bölüm</TableHead>
                      <TableHead>Madde</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="hidden md:table-cell">Değerlendiren</TableHead>
                      <TableHead className="hidden md:table-cell">Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">{STANDARD_LABELS[r.standard]}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.sectionCode} — {r.sectionTitle}</TableCell>
                        <TableCell className="max-w-[280px]">
                          <p className="font-medium">{r.itemCode} {r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.evidenceNote}</p>
                        </TableCell>
                        <TableCell>
                          <ChecklistStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{r.reviewedBy}</TableCell>
                        <TableCell className="hidden whitespace-nowrap md:table-cell">{formatDate(r.reviewDate)}</TableCell>
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
