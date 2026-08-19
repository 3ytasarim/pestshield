"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Printer, QrCode as QrCodeIcon, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { QrCodeImage } from "@/components/operations/qr-code-image";
import { KrokiStationQrModal, krokiStationQrValue } from "@/components/operations/kroki-station-qr-modal";
import { stationColor, stationLabel } from "@/components/crm/kroki-constants";
import type { KrokiStationType } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

export interface KrokiStationRow {
  id: string;
  type: KrokiStationType;
  number: number | null;
  stationId: string;
  sketchName: string;
  serviceName: string;
  customer: { id: string; companyName: string } | null;
}

function displayLabel(station: KrokiStationRow): string {
  return station.stationId || (station.number != null ? `İstasyon ${station.number}` : "İstasyon");
}

export function QrCheckPage({ initialStations }: { initialStations: KrokiStationRow[] }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedStation, setSelectedStation] = useState<KrokiStationRow | null>(null);
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
    if (!q) return stations;
    return stations.filter(
      (s) =>
        displayLabel(s).toLowerCase().includes(q) ||
        s.customer?.companyName.toLowerCase().includes(q) ||
        s.sketchName.toLowerCase().includes(q),
    );
  }, [stations, search]);

  const coveredCustomerCount = useMemo(
    () => new Set(stations.map((s) => s.customer?.id).filter(Boolean)).size,
    [stations],
  );

  async function printAll() {
    if (filtered.length === 0) return;
    setPrinting(true);
    try {
      const labels = await Promise.all(
        filtered.map(async (s) => ({
          label: displayLabel(s),
          customer: s.customer?.companyName ?? "",
          dataUrl: await QRCode.toDataURL(krokiStationQrValue(s), { width: 220, margin: 1, color: { dark: "#0f2942", light: "#ffffff" } }),
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CrmKpiCard label="Toplam Etiket" value={stations.length} description="QR kodu tanımlı istasyon" changePercent={5} icon={QrCodeIcon} accent="blue" delay={0.05} />
        <CrmKpiCard label="Kapsanan Müşteri" value={coveredCustomerCount} description="Etiketli istasyona sahip müşteri" changePercent={4} icon={QrCodeIcon} accent="emerald" delay={0.1} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İstasyon veya müşteriye göre ara…" className="h-11 rounded-xl pl-10" />
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
                  <QrCodeImage value={krokiStationQrValue(station)} size={96} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{displayLabel(station)}</p>
                    <p className="truncate text-xs text-muted-foreground">{station.customer?.companyName}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{ background: `${stationColor(station.type)}1a`, color: stationColor(station.type) }}
                  >
                    <span className="size-2 rounded-full" style={{ background: stationColor(station.type) }} />
                    {stationLabel(station.type)}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      {filtered.length > 60 && (
        <p className="text-center text-xs text-muted-foreground">İlk 60 istasyon gösteriliyor — daraltmak için arama kullanın.</p>
      )}

      <KrokiStationQrModal station={selectedStation} open={!!selectedStation} onOpenChange={(open) => !open && setSelectedStation(null)} />
    </div>
  );
}
