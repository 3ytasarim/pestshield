"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CircleCheck, Clock, FileText, ReceiptText, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate, formatDateTime } from "@/components/crm/crm-format";
import { getTahakkukRows, type TahakkukDurumu, type TahakkukRow } from "@/lib/tahakkuk-report-data";
import { getOccurrenceById, getBatchById } from "@/lib/periyot-store";
import { getEk1FormFor } from "@/lib/ek1-form-store";
import { printEk1Form } from "@/lib/pdf/ek1-report";
import { customers } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

const DURUM_BADGE: Record<TahakkukDurumu, string> = {
  tamamlandi: "bg-success/15 text-success",
  bekliyor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const DURUM_LABEL: Record<TahakkukDurumu, string> = {
  tamamlandi: "Tamamlandı",
  bekliyor: "Bekliyor",
};

interface Applied {
  startDate: string;
  endDate: string;
  customerId: string;
  durum: string;
}

const INITIAL_APPLIED: Applied = { startDate: "", endDate: "", customerId: "all", durum: "all" };

export function TahakkukReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerId, setCustomerId] = useState("all");
  const [durum, setDurum] = useState("all");
  const [applied, setApplied] = useState<Applied>(INITIAL_APPLIED);
  const [search, setSearch] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      getTahakkukRows({
        startDate: applied.startDate || undefined,
        endDate: applied.endDate || undefined,
        customerId: applied.customerId !== "all" ? applied.customerId : undefined,
        durum: applied.durum !== "all" ? (applied.durum as TahakkukDurumu) : undefined,
      }),
    [applied],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.customerName.toLowerCase().includes(q) || r.serviceName.toLowerCase().includes(q));
  }, [rows, search]);

  const tamamlananCount = rows.filter((r) => r.durum === "tamamlandi").length;
  const bekleyenCount = rows.filter((r) => r.durum === "bekliyor").length;

  function handleListele() {
    setApplied({ startDate, endDate, customerId, durum });
  }

  async function handleOpenBelge(row: TahakkukRow) {
    if (!row.hasEk1) return;
    setOpeningId(row.occurrenceId);
    try {
      const form = getEk1FormFor(row.occurrenceId);
      const occurrence = getOccurrenceById(row.occurrenceId);
      const batch = getBatchById(row.batchId);
      if (!form || !occurrence) return;
      await printEk1Form(form, occurrence, row.customerName, batch?.name ?? row.serviceName);
    } finally {
      setOpeningId(null);
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
          <ReceiptText className="size-7 text-primary" />
          Tahakkuk Raporları
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Tüm müşteriler genelinde periyot ziyaretlerinin tahakkuk (hakediş) durumu — EK-1 formu imzalanıp tamamlanan ve bekleyen kayıtlar.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 items-end gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <Label className="mb-1.5">Başlangıç Tarihi</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
          </div>
          <div>
            <Label className="mb-1.5">Bitiş Tarihi</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
          </div>
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
            <Label className="mb-1.5">Periyot Durumu</Label>
            <Select value={durum} onValueChange={(v) => setDurum(v ?? "all")}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="tamamlandi">Tamamlandı</SelectItem>
                <SelectItem value="bekliyor">Bekliyor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleListele} className="h-11 rounded-xl">
            <Search className="size-4" />
            Listele
          </Button>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Kayıt bulunamadı" description="Seçilen filtrelere uygun periyot kaydı yok." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CrmKpiCard label="Toplam Kayıt" value={rows.length} description="Filtrelenen periyot kaydı" changePercent={4} icon={ReceiptText} accent="blue" delay={0.05} />
            <CrmKpiCard label="Tamamlandı" value={tamamlananCount} description="EK-1 formu imzalanmış" changePercent={5} icon={CircleCheck} accent="emerald" delay={0.1} />
            <CrmKpiCard label="Bekliyor" value={bekleyenCount} description="EK-1 formu bekleyen" changePercent={-2} icon={Clock} accent="amber" delay={0.15} />
          </div>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
              <span className="text-sm font-semibold text-foreground">Tahakkuk Kayıtları</span>
              <div className="relative w-full max-w-[220px]">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Müşteri veya hizmet ara…"
                  className="h-9 rounded-lg pl-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="min-w-0 px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Hizmet Türü</TableHead>
                      <TableHead className="hidden lg:table-cell">Adres</TableHead>
                      <TableHead className="hidden md:table-cell">Şehir</TableHead>
                      <TableHead className="hidden md:table-cell">İlçe</TableHead>
                      <TableHead>Periyot Tarihi</TableHead>
                      <TableHead>Periyot Durumu</TableHead>
                      <TableHead className="hidden sm:table-cell">Tarih</TableHead>
                      <TableHead className="hidden lg:table-cell">Biyosidal Ürünler</TableHead>
                      <TableHead className="text-center">Belge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((r, i) => (
                      <TableRow key={r.occurrenceId}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{r.customerName}</TableCell>
                        <TableCell>{r.serviceName}</TableCell>
                        <TableCell className="hidden max-w-[220px] truncate lg:table-cell">{r.address}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.city}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.district}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(r.periodDate)}</TableCell>
                        <TableCell>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", DURUM_BADGE[r.durum])}>
                            {DURUM_LABEL[r.durum]}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-xs whitespace-nowrap text-muted-foreground sm:table-cell">
                          {r.recordedAt ? formatDateTime(r.recordedAt) : "—"}
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate lg:table-cell">{r.biocidalProducts}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!r.hasEk1}
                            loading={openingId === r.occurrenceId}
                            title={r.hasEk1 ? "İmzalanan EK-1 Belgesini Aç" : "Bu periyot için EK-1 formu henüz oluşturulmadı"}
                            onClick={() => handleOpenBelge(r)}
                            className={cn("rounded-lg hover:bg-muted", r.hasEk1 && "text-success hover:text-success")}
                          >
                            <FileText className={cn("size-4", r.hasEk1 && "fill-success/20")} />
                          </Button>
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
