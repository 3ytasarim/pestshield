"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartNoAxesCombined, Minus, Printer, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/components/crm/crm-format";
import type { TrendAnalysis } from "@/lib/trend-analysis";
import { printTrendAnalysisReport } from "@/lib/pdf/trend-report";
import type { Customer, ServiceOrder } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#0d9488", "#0891b2", "#f59e0b", "#dc2626", "#7c3aed", "#16a34a"];

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

interface TrendAnalizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string | null;
  customerId: string | null;
  serviceName: string;
}

export function TrendAnalizDialog({ open, onOpenChange, serviceOrderId, customerId, serviceName }: TrendAnalizDialogProps) {
  const [printing, setPrinting] = useState(false);
  const [selectedServiceOrderId, setSelectedServiceOrderId] = useState<string | null>(serviceOrderId);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [fullAnalysis, setFullAnalysis] = useState<TrendAnalysis | null>(null);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);

  useEffect(() => {
    if (open) setSelectedServiceOrderId(serviceOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceOrderId]);

  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    fetch(`/api/crm/customers/${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customer?: Customer } | null) => {
        if (!cancelled && data?.customer) setCustomer(data.customer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  useEffect(() => {
    if (!customerId) {
      setServiceOrders([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/crm/service-orders?customerId=${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { serviceOrders?: ServiceOrder[] } | null) => {
        if (!cancelled) setServiceOrders(data?.serviceOrders ?? []);
      })
      .catch(() => {
        if (!cancelled) setServiceOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const selectedServiceOrder = serviceOrders.find((o) => o.id === selectedServiceOrderId) ?? null;
  const activeServiceName = selectedServiceOrder?.description ?? serviceName;

  useEffect(() => {
    if (!open || !selectedServiceOrderId) {
      setFullAnalysis(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/reports/trend-analysis?serviceOrderId=${selectedServiceOrderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { analysis?: TrendAnalysis } | null) => {
        if (!cancelled) setFullAnalysis(data?.analysis ?? null);
      })
      .catch(() => {
        if (!cancelled) setFullAnalysis(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedServiceOrderId]);

  const years = useMemo(() => {
    if (!fullAnalysis) return [];
    return Array.from(new Set(fullAnalysis.months.map((m) => m.monthKey.slice(0, 4)))).sort();
  }, [fullAnalysis]);

  useEffect(() => {
    const latest = fullAnalysis?.months.at(-1);
    setSelectedYear(latest ? latest.monthKey.slice(0, 4) : null);
    setSelectedMonth(latest ? latest.monthKey.slice(5, 7) : null);
  }, [fullAnalysis]);

  const monthsInYear = useMemo(() => {
    if (!fullAnalysis || !selectedYear) return [];
    return fullAnalysis.months.filter((m) => m.monthKey.startsWith(selectedYear));
  }, [fullAnalysis, selectedYear]);

  const monthKey = selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : null;

  useEffect(() => {
    if (!selectedServiceOrderId || !monthKey) {
      setAnalysis(fullAnalysis);
      return;
    }
    let cancelled = false;
    fetch(`/api/reports/trend-analysis?serviceOrderId=${selectedServiceOrderId}&asOfMonthKey=${monthKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { analysis?: TrendAnalysis } | null) => {
        if (!cancelled) setAnalysis(data?.analysis ?? fullAnalysis);
      })
      .catch(() => {
        if (!cancelled) setAnalysis(fullAnalysis);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedServiceOrderId, monthKey, fullAnalysis]);

  async function handlePrint() {
    if (!analysis || !customer) return;
    setPrinting(true);
    try {
      await printTrendAnalysisReport(analysis, customer, activeServiceName);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChartNoAxesCombined className="size-5 text-primary" />
            Trend Analiz Raporu
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5">Hizmet Türü</Label>
            <Select
              value={selectedServiceOrderId ?? undefined}
              onValueChange={(v) => setSelectedServiceOrderId(String(v))}
              disabled={serviceOrders.length === 0}
            >
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Hizmet Türü Seçiniz…">
                  {() => selectedServiceOrder?.description ?? "Hizmet Türü Seçiniz…"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {serviceOrders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5">Ay</Label>
            <Select value={selectedMonth ?? undefined} onValueChange={(v) => setSelectedMonth(String(v))} disabled={monthsInYear.length === 0}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Ay Seçiniz…">
                  {() => (selectedMonth ? AY_ADLARI[Number(selectedMonth) - 1] : "Ay Seçiniz…")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {monthsInYear.map((m) => (
                  <SelectItem key={m.monthKey} value={m.monthKey.slice(5, 7)}>
                    {AY_ADLARI[Number(m.monthKey.slice(5, 7)) - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5">Yıl</Label>
            <Select value={selectedYear ?? undefined} onValueChange={(v) => setSelectedYear(String(v))} disabled={years.length === 0}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Yıl Seçiniz…">{() => selectedYear ?? "Yıl Seçiniz…"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {analysis && analysis.months.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" loading={printing} onClick={handlePrint}>
              <Printer className="size-3.5" />
              Yazdır / PDF
            </Button>
          </div>
        )}

        <div className="max-h-[70vh] min-w-0 overflow-y-auto pr-1">
          {!analysis || analysis.sketches.length === 0 ? (
            <div className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
              Bu hizmete ait tanımlı kroki bulunamadı. Önce Kroki Tanımlama&apos;dan bir kroki ekleyin.
            </div>
          ) : analysis.months.length === 0 ? (
            <div className="rounded-xl bg-destructive/10 px-4 py-6 text-center text-sm font-medium text-destructive">
              Bu hizmet için henüz istasyon denetim kaydı bulunamadı. Periyot ziyaretlerinde “İstasyonlar” formunu doldurun.
            </div>
          ) : (
            <TrendAnalysisContent analysis={analysis} customerName={customer?.companyName ?? "—"} serviceName={activeServiceName} />
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeltaBadge({ latest, previous }: { latest: number; previous: number | null }) {
  if (previous === null) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"><Minus className="size-3" />Kıyas yok</span>;
  }
  const diff = latest - previous;
  if (diff === 0) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"><Minus className="size-3" />Değişmedi</span>;
  }
  const up = diff > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        up ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success",
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {Math.abs(diff)} puan
    </span>
  );
}

export function TrendAnalysisContent({ analysis, customerName, serviceName }: { analysis: TrendAnalysis; customerName: string; serviceName: string }) {
  const a = analysis;
  const latestMonth = a.months.at(-1)!;
  const krokiSummary = a.sketches.length === 1 ? a.sketches[0].name : `${a.sketches.length} kroki`;

  return (
    <div className="flex flex-col gap-5 pb-1">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-5 text-white shadow-md">
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">Genel Trend Analizi — {krokiSummary}</p>
        <h3 className="mt-1 text-lg font-bold">{customerName}</h3>
        <p className="text-sm text-white/85">{serviceName}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat label="İncelenen Ay" value={latestMonth.monthLabel} />
          <HeroStat label="Toplam İstasyon" value={String(a.totalStations)} />
          <HeroStat label="Aktif İstasyon Oranı" value={`%${a.activeStationRatioLatest}`} />
          <HeroStat label="En Sık Görülen Grup" value={a.topGroupLabel} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Önceki Periyot Kıyası</p>
          <div className="mt-1.5 flex items-center gap-2">
            <DeltaBadge latest={a.activeStationRatioLatest} previous={a.activeStationRatioPrevious} />
          </div>
          <p className="mt-1.5 text-sm text-foreground">{a.previousComparisonText}</p>
        </div>
        <div className="rounded-2xl border border-border/60 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Baskın Tür</p>
          <p className="mt-1.5 text-sm font-semibold text-foreground">{a.dominantTur ?? "Farklı tür gözlenmedi"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Toplam İstasyon: {a.byTypeCounts.map((t) => `${t.label}: ${t.count}`).join(", ")}</p>
        </div>
      </div>

      {!a.hasEnoughData && (
        <div className="rounded-xl border border-dashed border-amber-400/60 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Karşılaştırmalı trend için en az 2 periyot verisi gerekir — şu an {a.months.length} ay verisi var.
        </div>
      )}

      {/* Aktiflik oranı trendi */}
      <ChartCard title="Ay/Periyot Bazında Aktif İstasyon Oranı" description="Aktif Zehirsiz (%) ve Aktif Zehirli (%) oranlarının aylık değişimi.">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={a.activityRateSeries} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" unit="%" />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Aktif Zehirsiz (%)" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Aktif Zehirli (%)" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Zehirli istasyon */}
      {a.zehirliSeries.some((s) => s["Yem Tüketimi Var"] + s["Yem Tüketimi Yok"] + s["İstasyon Kırık / Kayıp"] > 0) && (
        <ChartCard title="Zehirli İstasyon" description="Zaman serisi (ay) bazında yem tüketimi dağılımı.">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.zehirliSeries} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Yem Tüketimi Var" stackId="s" fill="#dc2626" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Yem Tüketimi Yok" stackId="s" fill="#16a34a" />
              <Bar dataKey="İstasyon Kırık / Kayıp" stackId="s" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Zehirsiz istasyon */}
      {a.zehirsizSeries.some((s) => s["Hareket Var"] + s["Hareket Yok"] + s["İstasyon Kırık / Kayıp"] > 0) && (
        <ChartCard title="Zehirsiz İstasyon" description="Hareket var/yok dağılımı ve tespit edilen tür dağılımı (son ay).">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={a.zehirsizSeries} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Hareket Var" stackId="s" fill="#dc2626" />
                <Bar dataKey="Hareket Yok" stackId="s" fill="#16a34a" />
                <Bar dataKey="İstasyon Kırık / Kayıp" stackId="s" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {a.zehirsizTurDagilimi.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={a.zehirsizTurDagilimi} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={{ fontSize: 10 }}>
                    {a.zehirsizTurDagilimi.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      )}

      {/* Uçkun aktivitesi trend */}
      {a.uckunSayimTrend.some((s) => s["İç Alan"] + s["Dış Alan"] > 0) && (
        <ChartCard title="Uçkun Aktivitesi Trend Analizi (Dış Alan / İç Alan)" description="Ay/Periyot bazında toplam uçkun sayımı (adet).">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={a.uckunSayimTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="İç Alan" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Dış Alan" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Dış alan uçkun istasyonlarında gözlemlenen artışlar, iç alan uçkun riskinin erken göstergesi olarak değerlendirilir.
          </p>
        </ChartCard>
      )}

      {/* Risk Haritası */}
      {(a.riskTopIc.length > 0 || a.riskTopDis.length > 0) && (
        <div className="rounded-2xl border border-border/60 p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Risk Haritası / Önceliklendirme (Top 5 Uçkun)</p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RiskTable title="İç Alan (Top 5)" rows={a.riskTopIc} />
            <RiskTable title="Dış Alan (Top 5)" rows={a.riskTopDis} />
          </div>
        </div>
      )}

      {/* Detaylı Karşılaştırma */}
      {Object.entries(a.comparisonTables).map(([type, rows]) => (
        <ComparisonSection key={type} typeLabel={typeLabelFor(type)} rows={rows!} />
      ))}

      {/* Biyosidal ürün kayıtları */}
      <div className="rounded-2xl border border-border/60 p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Biyosidal Ürün Kullanım Kayıtları</p>
        {a.biocidalRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">Kayıt bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ay</TableHead>
                  <TableHead>Periyot Tarihi</TableHead>
                  <TableHead>Kullanılan Ürünler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {a.biocidalRecords.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.monthLabel}</TableCell>
                    <TableCell>{formatDate(r.occurrenceDate)}</TableCell>
                    <TableCell>{r.text}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function typeLabelFor(type: string): string {
  return { zehirli: "Zehirli İstasyon", zehirsiz: "Zehirsiz İstasyon", ic_uckun: "İç Alan Uçkun İstasyon", dis_uckun: "Dış Alan Uçkun İstasyon" }[type] ?? type;
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="text-[10px] font-medium text-white/70 uppercase">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

function RiskTable({ title, rows }: { title: string; rows: { periyotTarihi: string; krokiName: string; istasyonNo: number; sayim: number }[] }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase">{title}</p>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Periyot Tarihi</TableHead>
              <TableHead className="text-xs">Kroki</TableHead>
              <TableHead className="text-xs">İstasyon No</TableHead>
              <TableHead className="text-xs">Sayım</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs">{formatDate(r.periyotTarihi)}</TableCell>
                <TableCell className="text-xs">{r.krokiName}</TableCell>
                <TableCell className="text-xs font-medium">#{r.istasyonNo}</TableCell>
                <TableCell className="text-xs font-semibold">{r.sayim}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ComparisonSection({
  typeLabel,
  rows,
}: {
  typeLabel: string;
  rows: { stationId: string; krokiName: string; istasyonNo: number; cells: { monthLabel: string; occurrenceDate: string; primary: string; secondary?: string; tone: "bad" | "good" | "neutral" }[] }[];
}) {
  const monthLabels = rows[0]?.cells.map((c) => c.monthLabel) ?? [];
  return (
    <div className="min-w-0 rounded-2xl border border-border/60 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{typeLabel} — Detaylı Karşılaştırma</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kroki</TableHead>
              <TableHead>İstasyon No</TableHead>
              {monthLabels.map((m) => (
                <TableHead key={m}>{m}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.stationId}>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{row.krokiName}</TableCell>
                <TableCell className="font-semibold whitespace-nowrap">#{row.istasyonNo}</TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell key={i} className="text-xs whitespace-nowrap">
                    <p className="text-[10px] text-muted-foreground">{formatDate(cell.occurrenceDate)}</p>
                    <p
                      className={cn(
                        "font-semibold",
                        cell.tone === "bad" && "text-destructive",
                        cell.tone === "good" && "text-success",
                      )}
                    >
                      {cell.primary}
                    </p>
                    {cell.secondary && <p className="text-[10px] text-muted-foreground">{cell.secondary}</p>}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
