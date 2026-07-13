"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Printer, Route as RouteIcon, Timer, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { getPdksRows } from "@/lib/pdks-report-data";
import { printPdksReport } from "@/lib/pdf/pdks-report";
import { technicians } from "@/lib/mock/operations";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  Tamamlandı: "bg-success/15 text-success",
  "Devam Ediyor": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Başlamadı: "bg-muted text-muted-foreground",
};

export function PdksReportPage() {
  const [technicianId, setTechnicianId] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [printing, setPrinting] = useState(false);

  const technician = technicianId === "all" ? null : (technicians.find((t) => t.id === technicianId) ?? null);

  const rows = useMemo(
    () => getPdksRows({ technicianName: technician?.name ?? null, startDate: startDate || undefined, endDate: endDate || undefined }),
    [technician, startDate, endDate],
  );

  const totalMinutes = rows.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
  const totalDistance = rows.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalStops = rows.reduce((sum, r) => sum + r.stopCount, 0);

  function fmtDuration(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}s ${m}dk`;
  }

  const dateRangeLabel = startDate || endDate ? `${startDate ? formatDate(startDate) : "…"} – ${endDate ? formatDate(endDate) : "…"}` : "Tüm kayıtlar";

  async function handlePrint() {
    setPrinting(true);
    try {
      await printPdksReport(rows, technician, dateRangeLabel);
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
          <Clock className="size-7 text-primary" />
          PDKS Personel Çalışma Saatleri
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Teknisyenlerin günlük mesai başlangıç/bitiş saatleri, çalışma süresi ve saha rotası özeti.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5">Personel</Label>
            <Select value={technicianId} onValueChange={(v) => setTechnicianId(v ?? "all")}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Personel</SelectItem>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">Başlangıç Tarihi</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
          </div>
          <div>
            <Label className="mb-1.5">Bitiş Tarihi</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={Clock} title="Kayıt bulunamadı" description="Seçilen filtrelere uygun mesai kaydı yok." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CrmKpiCard label="Toplam Gün" value={rows.length} description="Kayıtlı mesai günü" changePercent={4} icon={Users} accent="blue" delay={0.05} />
            <CrmKpiCard label="Toplam Çalışma Süresi" value={totalMinutes} format={(v) => fmtDuration(v)} description="Tüm kayıtların toplamı" changePercent={6} icon={Timer} accent="emerald" delay={0.1} />
            <CrmKpiCard label="Toplam Mesafe" value={totalDistance} format={(v) => `${v.toFixed(1)} km`} description="Saha rotası" changePercent={3} icon={RouteIcon} accent="amber" delay={0.15} />
            <CrmKpiCard label="Toplam Ziyaret" value={totalStops} description="Müşteri durakları" changePercent={5} icon={Clock} accent="blue" delay={0.2} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Mesai Kayıtları</span>
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
                      <TableHead>Tarih</TableHead>
                      <TableHead>Personel</TableHead>
                      <TableHead>Giriş Saati</TableHead>
                      <TableHead>Çıkış Saati</TableHead>
                      <TableHead>Çalışma Süresi</TableHead>
                      <TableHead className="hidden sm:table-cell">Ziyaret</TableHead>
                      <TableHead className="hidden sm:table-cell">Mesafe</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.workdayId}>
                        <TableCell className="font-medium whitespace-nowrap">{formatDate(r.date)}</TableCell>
                        <TableCell>{r.technicianName}</TableCell>
                        <TableCell>{r.startTime ?? "—"}</TableCell>
                        <TableCell>{r.endTime ?? "—"}</TableCell>
                        <TableCell>{r.durationMinutes !== null ? fmtDuration(r.durationMinutes) : "Devam ediyor"}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.stopCount}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.distanceKm.toFixed(1)} km</TableCell>
                        <TableCell>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_BADGE[r.statusLabel])}>{r.statusLabel}</span>
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
