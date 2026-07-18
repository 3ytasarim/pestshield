"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Printer, QrCode as QrCodeIcon, Search, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { StationStatusBadge } from "@/components/operations/operations-badges";
import { QrCodeImage } from "@/components/operations/qr-code-image";
import { StationQrModal, stationQrValue } from "@/components/operations/station-qr-modal";
import { isStationOverdue, type Station } from "@/lib/mock/operations";
import { cn } from "@/lib/utils";

interface StationWithCustomer extends Station {
  customer: { id: string; companyName: string } | null;
}

export function QrCheckPage({
  initialStations,
  customers,
}: {
  initialStations: StationWithCustomer[];
  customers: { id: string; companyName: string }[];
}) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedStation, setSelectedStation] = useState<StationWithCustomer | null>(null);
  const [printing, setPrinting] = useState(false);

  const stations = initialStations;

  useEffect(() => {
    const stationId = searchParams.get("station");
    if (stationId) {
      const found = stations.find((s) => s.id === stationId);
      if (found) setSelectedStation(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stations.filter((s) => {
      if (customerFilter !== "all" && s.customerId !== customerFilter) return false;
      if (q && !s.label.toLowerCase().includes(q) && !s.qrCode.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stations, search, customerFilter]);

  const overdueCount = useMemo(() => stations.filter(isStationOverdue).length, [stations]);

  async function printAll() {
    if (filtered.length === 0) return;
    setPrinting(true);
    try {
      const labels = await Promise.all(
        filtered.map(async (s) => ({
          label: s.label,
          code: s.qrCode,
          customer: s.customer?.companyName ?? "",
          dataUrl: await QRCode.toDataURL(stationQrValue(s), { width: 220, margin: 1, color: { dark: "#0f2942", light: "#ffffff" } }),
        })),
      );
      const win = window.open("", "_blank");
      if (!win) return;
      const cards = labels
        .map(
          (l) => `
        <div class="label">
          <img src="${l.dataUrl}" alt="QR" />
          <p class="title">${l.label}</p>
          <p class="customer">${l.customer}</p>
          <p class="code">${l.code}</p>
        </div>`,
        )
        .join("");
      win.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>İstasyon Etiketleri</title>
        <style>
          body{font-family:Arial,sans-serif;margin:24px;}
          .grid{display:flex;flex-wrap:wrap;gap:16px;}
          .label{border:1px dashed #94a3b8;border-radius:12px;padding:16px;text-align:center;width:180px;}
          .label img{width:120px;height:120px;}
          .label p.title{font-weight:700;font-size:12px;margin:6px 0 1px;}
          .label p.customer{font-size:10px;color:#475569;margin:0;}
          .label p.code{font-family:monospace;font-size:10px;color:#64748b;margin:2px 0 0;}
        </style></head>
        <body><div class="grid">${cards}</div><script>window.print();</script></body></html>`);
      win.document.close();
      toast.success(`${labels.length} etiket yazdırmaya gönderildi`);
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
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">QR Kontrol</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            İstasyon etiketleri üretin, yazdırın ve teknisyenlerin sahada okutması için hazırlayın.
          </p>
        </div>
        <Button onClick={printAll} loading={printing} disabled={filtered.length === 0}>
          <Printer className="size-4" />
          Görünen Etiketleri Yazdır ({filtered.length})
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Etiket" value={stations.length} description="QR kodu tanımlı istasyon" changePercent={5} icon={QrCodeIcon} accent="blue" delay={0.05} />
        <CrmKpiCard label="Vadesi Geçen Kontrol" value={overdueCount} description="Okutulması gereken istasyon" changePercent={overdueCount > 0 ? 12 : -12} icon={ShieldAlert} accent="amber" delay={0.1} />
        <CrmKpiCard label="Kapsanan Müşteri" value={customers.length} description="Etiketli istasyona sahip müşteri" changePercent={4} icon={QrCodeIcon} accent="emerald" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İstasyon veya QR koda göre ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCustomerFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              customerFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tüm Müşteriler
          </button>
          {customers.slice(0, 5).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCustomerFilter(c.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                customerFilter === c.id
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {c.companyName}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={QrCodeIcon} title="İstasyon bulunamadı" description="Seçili filtrelere uyan istasyon yok." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, 60).map((station, index) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index, 11) * 0.02, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className={cn(GLASS_CARD, "h-full cursor-pointer rounded-2xl")} onClick={() => setSelectedStation(station)}>
                <CardContent className="flex flex-col items-center gap-2.5 text-center">
                  <QrCodeImage value={stationQrValue(station)} size={96} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{station.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{station.customer?.companyName}</p>
                  </div>
                  <StationStatusBadge status={station.status} className="text-[10px]" />
                  {isStationOverdue(station) && <p className="text-[10px] font-medium text-destructive">Kontrol vadesi geçti</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      {filtered.length > 60 && (
        <p className="text-center text-xs text-muted-foreground">İlk 60 istasyon gösteriliyor — daraltmak için arama/filtre kullanın.</p>
      )}

      <StationQrModal station={selectedStation} open={!!selectedStation} onOpenChange={(open) => !open && setSelectedStation(null)} />
    </div>
  );
}
