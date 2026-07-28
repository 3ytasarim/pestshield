"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { TrendAnalysisContent } from "@/components/crm/trend-analiz-dialog";
import type { TrendAnalysis } from "@/lib/trend-analysis";
import type { ServiceOrder } from "@/lib/mock/crm";

const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export default function CustomerPortalTrendAnalysisPage() {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceOrderId, setServiceOrderId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    fetch("/api/portal/service-orders")
      .then((res) => (res.ok ? res.json() : { serviceOrders: [] }))
      .then((data: { serviceOrders?: ServiceOrder[] }) => {
        const orders = data.serviceOrders ?? [];
        setServiceOrders(orders);
        setServiceOrderId(orders[0]?.id ?? null);
      });
    fetch("/api/portal/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customer?: { companyName: string } } | null) => setCustomerName(data?.customer?.companyName ?? ""));
  }, []);

  const serviceOrder = serviceOrders.find((o) => o.id === serviceOrderId) ?? null;

  const [fullAnalysis, setFullAnalysis] = useState<TrendAnalysis | null>(null);
  const [displayAnalysis, setDisplayAnalysis] = useState<TrendAnalysis | null>(null);

  useEffect(() => {
    if (!serviceOrderId) {
      setFullAnalysis(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/portal/reports/trend-analysis?serviceOrderId=${serviceOrderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { analysis?: TrendAnalysis } | null) => {
        if (!cancelled) setFullAnalysis(data?.analysis ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceOrderId]);

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
    if (!serviceOrderId || !monthKey) {
      setDisplayAnalysis(fullAnalysis);
      return;
    }
    let cancelled = false;
    fetch(`/api/portal/reports/trend-analysis?serviceOrderId=${serviceOrderId}&asOfMonthKey=${monthKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { analysis?: TrendAnalysis } | null) => {
        if (!cancelled) setDisplayAnalysis(data?.analysis ?? fullAnalysis);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceOrderId, monthKey, fullAnalysis]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Trend Analiz Raporları</h1>
        <p className="text-sm text-muted-foreground">Hizmetinize ait istasyon denetimlerinin aylık trend analizi.</p>
      </div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5">Hizmet Türü</Label>
            <Select value={serviceOrderId ?? undefined} onValueChange={(v) => setServiceOrderId(String(v))} disabled={serviceOrders.length === 0}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Hizmet seçiniz…">{() => serviceOrder?.description ?? "Hizmet seçiniz…"}</SelectValue>
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
          <div>
            <Label className="mb-1.5">Ay</Label>
            <Select value={selectedMonth ?? undefined} onValueChange={(v) => setSelectedMonth(String(v))} disabled={monthsInYear.length === 0}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Ay Seçiniz…">{() => (selectedMonth ? AY_ADLARI[Number(selectedMonth) - 1] : "Ay Seçiniz…")}</SelectValue>
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
        </CardContent>
      </Card>

      {serviceOrders.length === 0 ? (
        <EmptyState icon={ChartNoAxesCombined} title="Hizmet kaydı bulunamadı" description="Hesabınıza ait bir hizmet kaydı yok." />
      ) : !fullAnalysis || fullAnalysis.sketches.length === 0 ? (
        <EmptyState icon={ChartNoAxesCombined} title="Kroki bulunamadı" description="Bu hizmete ait kayıtlı bir kroki yok." />
      ) : !displayAnalysis || displayAnalysis.months.length === 0 ? (
        <EmptyState icon={ChartNoAxesCombined} title="İstasyon denetim kaydı bulunamadı" description="Bu hizmet için henüz istasyon denetimi yapılmamış." />
      ) : (
        <Card className="min-w-0 rounded-2xl border-border/60 p-4 shadow-sm sm:p-5">
          <TrendAnalysisContent analysis={displayAnalysis} customerName={customerName || "—"} serviceName={serviceOrder?.description ?? "—"} />
        </Card>
      )}
    </div>
  );
}
