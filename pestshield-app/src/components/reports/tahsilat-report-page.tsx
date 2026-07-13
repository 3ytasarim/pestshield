"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Printer, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { PaymentMethodBadge } from "@/components/finance/finance-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { getTahsilatRows } from "@/lib/finance-report-data";
import { printTahsilatRaporu } from "@/lib/pdf/tahsilat-report";
import { customers } from "@/lib/mock/crm";

export function TahsilatReportPage() {
  const [customerId, setCustomerId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [printing, setPrinting] = useState(false);

  const rows = useMemo(
    () =>
      getTahsilatRows({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerId: customerId !== "all" ? customerId : undefined,
      }),
    [customerId, startDate, endDate],
  );

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const customerLabel = customerId === "all" ? "Tüm Müşteriler" : (customers.find((c) => c.id === customerId)?.companyName ?? "—");
  const dateRangeLabel = startDate || endDate ? `${startDate ? formatDate(startDate) : "…"} – ${endDate ? formatDate(endDate) : "…"}` : "Tüm kayıtlar";

  async function handlePrint() {
    setPrinting(true);
    try {
      await printTahsilatRaporu(rows, dateRangeLabel, customerLabel);
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
          <Wallet className="size-7 text-primary" />
          Tahsilat Raporu
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Seçilen tarih aralığında ve müşteride gerçekleşen tüm tahsilatların (nakit/kart/havale) dökümü.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5">Müşteri</Label>
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "all")}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Müşteriler</SelectItem>
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

      {rows.length === 0 ? (
        <EmptyState icon={Wallet} title="Kayıt bulunamadı" description="Seçilen filtrelere uygun tahsilat kaydı yok." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CrmKpiCard label="Toplam Tahsilat" value={total} format={(v) => formatCurrency(v)} description="Filtrelenen dönem" changePercent={5} icon={Wallet} accent="emerald" delay={0.05} />
            <CrmKpiCard label="Tahsilat Sayısı" value={rows.length} description="Kayıtlı işlem" changePercent={3} icon={Wallet} accent="blue" delay={0.1} />
            <CrmKpiCard label="Ortalama Tahsilat" value={rows.length ? total / rows.length : 0} format={(v) => formatCurrency(v)} description="İşlem başına" changePercent={2} icon={Wallet} accent="amber" delay={0.15} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Tahsilat Kayıtları</span>
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
                      <TableHead>Müşteri</TableHead>
                      <TableHead className="hidden sm:table-cell">Açıklama</TableHead>
                      <TableHead>Yöntem</TableHead>
                      <TableHead className="hidden md:table-cell">Yetkili</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium whitespace-nowrap">{formatDate(r.date)}</TableCell>
                        <TableCell>{r.customerName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.description}</TableCell>
                        <TableCell>{r.method && <PaymentMethodBadge method={r.method} />}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.performedBy}</TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(r.amount)}</TableCell>
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
