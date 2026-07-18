"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChartNoAxesCombined, Printer } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { TrendAnalysisContent } from "@/components/crm/trend-analiz-dialog";
import { computeTrendAnalysis, type TrendAnalysis } from "@/lib/trend-analysis";
import { printTrendAnalysisReport } from "@/lib/pdf/trend-report";
import { loadServiceOrders } from "@/lib/service-order-store";
import type { Customer, ServiceOrder } from "@/lib/mock/crm";

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function TrendAnalysisReportPage() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceOrderId, setServiceOrderId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetch("/api/crm/customers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customers: Customer[] } | null) => setCustomers(data?.customers ?? []))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    if (!customerId) {
      setServiceOrders([]);
      setServiceOrderId(null);
      return;
    }
    const orders = loadServiceOrders().filter((o) => o.customerId === customerId);
    setServiceOrders(orders);
    setServiceOrderId(orders[0]?.id ?? null);
  }, [customerId]);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const serviceOrder = serviceOrders.find((o) => o.id === serviceOrderId) ?? null;

  const fullAnalysis: TrendAnalysis | null = useMemo(() => {
    if (!serviceOrderId) return null;
    return computeTrendAnalysis(serviceOrderId);
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

  const displayAnalysis: TrendAnalysis | null = useMemo(() => {
    if (!serviceOrderId || !monthKey) return fullAnalysis;
    return computeTrendAnalysis(serviceOrderId, monthKey);
  }, [serviceOrderId, monthKey, fullAnalysis]);

  async function handlePrint() {
    if (!displayAnalysis || !customer || !serviceOrder) return;
    setPrinting(true);
    try {
      await printTrendAnalysisReport(displayAnalysis, customer, serviceOrder.description);
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
          <ChartNoAxesCombined className="size-7 text-primary" />
          Trend Analiz Raporları
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Müşteri ve hizmet seçerek o hizmete ait tüm krokilerin genel trend analizini görüntüleyin ve PDF olarak dışa aktarın.
        </p>
      </motion.div>

      <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Filtreler</span>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <Label className="mb-1.5">Hizmet Türü</Label>
            <Select value={serviceOrderId ?? undefined} onValueChange={(v) => setServiceOrderId(String(v))} disabled={serviceOrders.length === 0}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Önce müşteri seçin…">
                  {() => serviceOrder?.description ?? (serviceOrders.length === 0 ? "Önce müşteri seçin…" : "Hizmet Türü Seçiniz…")}
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
        </CardContent>
      </Card>

      {!customerId ? (
        <EmptyState icon={ChartNoAxesCombined} title="Rapor için müşteri seçin" description="Önce yukarıdan bir müşteri ve hizmet türü seçin." />
      ) : !fullAnalysis || fullAnalysis.sketches.length === 0 ? (
        <EmptyState icon={ChartNoAxesCombined} title="Kroki bulunamadı" description="Bu hizmete ait kayıtlı bir kroki yok. Önce Hizmetler sayfasından Kroki Tanımlama yapın." />
      ) : !displayAnalysis || displayAnalysis.months.length === 0 ? (
        <EmptyState
          icon={ChartNoAxesCombined}
          title="İstasyon denetim kaydı bulunamadı"
          description="Bu hizmet için periyot ziyaretlerinde İstasyonlar formu henüz doldurulmamış."
        />
      ) : (
        <Card className="min-w-0 rounded-2xl border-border/60 p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" loading={printing} onClick={handlePrint}>
              <Printer className="size-3.5" />
              Yazdır / PDF
            </Button>
          </div>
          <TrendAnalysisContent analysis={displayAnalysis} customerName={customer?.companyName ?? "—"} serviceName={serviceOrder?.description ?? "—"} />
        </Card>
      )}
    </div>
  );
}
