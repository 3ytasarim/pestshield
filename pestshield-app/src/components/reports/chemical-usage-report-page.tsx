"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Printer } from "lucide-react";
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
import { getChemicalUsageRows } from "@/lib/chemical-usage-report-data";
import { printChemicalUsageReport } from "@/lib/pdf/chemical-usage-report";
import { customers } from "@/lib/mock/crm";

export function ChemicalUsageReportPage() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [printing, setPrinting] = useState(false);

  const customer = customers.find((c) => c.id === customerId) ?? null;

  const rows = useMemo(
    () => (customerId ? getChemicalUsageRows(customerId, { startDate: startDate || undefined, endDate: endDate || undefined }) : []),
    [customerId, startDate, endDate],
  );

  const serviceCount = new Set(rows.map((r) => r.serviceOrderId)).size;
  const dateRangeLabel = startDate || endDate ? `${startDate ? formatDate(startDate) : "…"} – ${endDate ? formatDate(endDate) : "…"}` : "Tüm kayıtlar";

  async function handlePrint() {
    if (!customer) return;
    setPrinting(true);
    try {
      await printChemicalUsageReport(rows, customer, dateRangeLabel);
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
          <FlaskConical className="size-7 text-primary" />
          Biyosidal Ürün Kullanım Raporu
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Müşteri bazında periyot ziyaretlerinde kullanılan biyosidal ürünlerin tarih sıralı kaydı — BRC/HACCP uygulama günlüğü.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5">Müşteri</Label>
            <Select value={customerId ?? undefined} onValueChange={(v) => setCustomerId(String(v))}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Müşteri seçiniz…" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
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

      {!customerId ? (
        <EmptyState icon={FlaskConical} title="Rapor için müşteri seçin" description="Yukarıdan bir müşteri seçerek biyosidal ürün kullanım kayıtlarını görüntüleyin." />
      ) : rows.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Kayıt bulunamadı" description="Bu müşteri için seçilen tarih aralığında biyosidal ürün kaydı yok." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CrmKpiCard label="Toplam Uygulama" value={rows.length} description="Kayıtlı biyosidal uygulama" changePercent={4} icon={FlaskConical} accent="amber" delay={0.05} />
            <CrmKpiCard label="Hizmet Sayısı" value={serviceCount} description="Farklı hizmet kaydı" changePercent={3} icon={FlaskConical} accent="blue" delay={0.1} />
            <CrmKpiCard label="Son Uygulama" value={rows[0] ? new Date(rows[0].date).getTime() : 0} format={() => (rows[0] ? formatDate(rows[0].date) : "—")} description="En güncel kayıt tarihi" changePercent={2} icon={FlaskConical} accent="emerald" delay={0.15} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Uygulama Kayıtları</span>
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
                      <TableHead>Hizmet</TableHead>
                      <TableHead className="hidden sm:table-cell">Personel</TableHead>
                      <TableHead>Kullanılan Ürünler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.occurrenceId}>
                        <TableCell className="font-medium whitespace-nowrap">{formatDate(r.date)}</TableCell>
                        <TableCell>{r.serviceName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.personnelName}</TableCell>
                        <TableCell>{r.products}</TableCell>
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
