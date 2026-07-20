"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Printer, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { printAlacakRaporu, type AlacakReportRow } from "@/lib/pdf/alacak-report";
import { cn } from "@/lib/utils";

export function AlacakReportPage() {
  const [printing, setPrinting] = useState(false);
  const [rows, setRows] = useState<AlacakReportRow[]>([]);

  useEffect(() => {
    fetch("/api/reports/alacak")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rows?: AlacakReportRow[] } | null) => setRows(data?.rows ?? []))
      .catch(() => setRows([]));
  }, []);

  const totalBalance = rows.reduce((sum, r) => sum + r.balance, 0);
  const overdueRows = rows.filter((r) => r.isOverdue);
  const totalOverdue = overdueRows.reduce((sum, r) => sum + r.balance, 0);

  async function handlePrint() {
    setPrinting(true);
    try {
      await printAlacakRaporu(rows);
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
          Alacak / Vade Raporu
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Borçlu müşterilerin güncel bakiyeleri ve vade durumu — hangi alacakların gecikmiş olduğunu tek bakışta gösterir.
        </p>
      </motion.div>

      {rows.length === 0 ? (
        <EmptyState icon={Wallet} title="Borçlu müşteri yok" description="Şu anda açık bakiyesi olan müşteri bulunmuyor." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CrmKpiCard label="Toplam Alacak" value={totalBalance} format={(v) => formatCurrency(v)} description="Tüm borçlu müşteriler" changePercent={-2} icon={Wallet} accent="blue" delay={0.05} />
            <CrmKpiCard label="Vadesi Geçen Tutar" value={totalOverdue} format={(v) => formatCurrency(v)} description="Gecikmiş bakiyeler" changePercent={-4} icon={AlertTriangle} accent="amber" delay={0.1} />
            <CrmKpiCard label="Vadesi Geçen Müşteri" value={overdueRows.length} description="Takip gereken hesap" changePercent={-1} icon={AlertTriangle} accent="amber" delay={0.15} />
            <CrmKpiCard label="Borçlu Müşteri Sayısı" value={rows.length} description="Açık bakiyesi olan" changePercent={2} icon={Wallet} accent="emerald" delay={0.2} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Borçlu Müşteriler</span>
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
                      <TableHead>Müşteri</TableHead>
                      <TableHead className="hidden sm:table-cell">Cari Kod</TableHead>
                      <TableHead className="hidden md:table-cell">Son Fatura Tarihi</TableHead>
                      <TableHead>Vade Durumu</TableHead>
                      <TableHead className="text-right">Bakiye</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.accountCode}>
                        <TableCell className="font-medium">{r.customerName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{r.accountCode}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.lastInvoiceDate ? formatDate(r.lastInvoiceDate) : "—"}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                              r.isOverdue ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success",
                            )}
                          >
                            {r.isOverdue ? `${r.overdueDays} gün gecikti` : "Vadesinde"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(r.balance)}</TableCell>
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
