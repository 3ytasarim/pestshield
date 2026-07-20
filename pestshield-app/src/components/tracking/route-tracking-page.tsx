"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  Pause,
  Play,
  Route as RouteIcon,
  RotateCcw,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { routeDistanceKm, type TechnicianWorkday } from "@/lib/mock/tracking";
import { cn } from "@/lib/utils";

interface ServerWorkday {
  id: string;
  technicianName: string;
  date: string;
  status: TechnicianWorkday["status"];
  startedAt: string | null;
  endedAt: string | null;
  pings: { lat: number; lng: number; recordedAt: string }[];
}

function toWorkday(w: ServerWorkday): TechnicianWorkday {
  const breadcrumbs = w.pings.map((p) => ({ lat: p.lat, lng: p.lng, timestamp: p.recordedAt }));
  const stops: TechnicianWorkday["stops"] = [];
  if (breadcrumbs.length > 0) {
    stops.push({
      id: `${w.id}-start`,
      label: "Başlangıç",
      customerId: null,
      lat: breadcrumbs[0].lat,
      lng: breadcrumbs[0].lng,
      arrivedAt: null,
      departedAt: w.startedAt,
      workOrderNo: null,
    });
    const last = breadcrumbs[breadcrumbs.length - 1];
    stops.push({
      id: `${w.id}-${w.status === "completed" ? "end" : "current"}`,
      label: w.status === "completed" ? "Bitiş" : "Şu An",
      customerId: null,
      lat: last.lat,
      lng: last.lng,
      arrivedAt: w.status === "completed" ? w.endedAt : last.timestamp,
      departedAt: null,
      workOrderNo: null,
    });
  }
  return {
    id: w.id,
    technicianName: w.technicianName,
    date: w.date,
    status: w.status,
    startedAt: w.startedAt,
    endedAt: w.endedAt,
    stops,
    breadcrumbs,
  };
}

const RouteMap = dynamic(() => import("@/components/tracking/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">Harita yükleniyor…</div>,
});

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function durationLabel(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "—";
  const minutes = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} sa ${m} dk`;
}

const STATUS_LABELS: Record<TechnicianWorkday["status"], string> = {
  not_started: "Henüz Başlamadı",
  in_progress: "Sahada",
  completed: "Tamamlandı",
};

const STATUS_STYLES: Record<TechnicianWorkday["status"], string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
};

export function RouteTrackingPage() {
  const [workdays, setWorkdays] = useState<TechnicianWorkday[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [liveIndex, setLiveIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/operations/routes")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { workdays: ServerWorkday[] } | null) => {
        if (cancelled || !data) return;
        const mapped = data.workdays.map(toWorkday);
        setWorkdays(mapped);
        setSelectedId((prev) => prev || (mapped[0]?.id ?? ""));
      })
      .catch(() => {
        if (!cancelled) setWorkdays([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const workday = workdays?.find((w) => w.id === selectedId) ?? workdays?.[0] ?? null;
  const distance = useMemo(() => (workday ? routeDistanceKm(workday.breadcrumbs) : 0), [workday]);

  useEffect(() => {
    setLiveIndex(null);
    setPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [selectedId]);

  useEffect(() => {
    if (!playing || !workday) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setLiveIndex((prev) => {
        const next = (prev ?? -1) + 1;
        if (next >= workday.breadcrumbs.length) {
          setPlaying(false);
          return prev;
        }
        return next;
      });
    }, 180);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, workday]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Günlük Rotalar</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Teknisyenlerin sahada işe başladıkları andan işi sonlandırdıkları ana kadar izledikleri rota — telefonlarından
          gönderdikleri gerçek konum verisiyle.
        </p>
      </motion.div>

      {workdays === null ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Yükleniyor…</div>
      ) : workdays.length === 0 ? (
        <EmptyState icon={RouteIcon} title="Aktif teknisyen yok" description="Firmanıza kayıtlı aktif bir teknisyen bulunamadı." />
      ) : (
      <>
      <div className="flex flex-wrap gap-1.5">
        {workdays.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setSelectedId(w.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              selectedId === w.id
                ? "border-primary/20 bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <User className="size-3.5" />
            {w.technicianName}
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", selectedId === w.id ? "bg-white/20" : STATUS_STYLES[w.status])}>
              {STATUS_LABELS[w.status]}
            </span>
          </button>
        ))}
      </div>

      {!workday ? null : workday.status === "not_started" ? (
        <EmptyState icon={RouteIcon} title="Henüz rota yok" description={`${workday.technicianName} bugün henüz işe başlamadı.`} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={GLASS_CARD}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <RouteIcon className="size-4.5" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{distance} km</p>
                  <p className="text-xs text-muted-foreground">Toplam Mesafe</p>
                </div>
              </CardContent>
            </Card>
            <Card className={GLASS_CARD}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Clock className="size-4.5" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{durationLabel(workday.startedAt, workday.endedAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(workday.startedAt)} — {formatTime(workday.endedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className={GLASS_CARD}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="size-4.5" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{workday.stops.length}</p>
                  <p className="text-xs text-muted-foreground">Durak (depo dahil)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
            <Card className={cn(GLASS_CARD, "flex min-w-0 flex-col gap-0 rounded-2xl p-0")}>
              <div className="flex items-center justify-between gap-2 border-b border-border/60 p-3.5">
                <span className="text-sm font-semibold text-foreground">Zaman Çizelgesi</span>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? "Duraklat" : "Rotayı Oynat"}
                  >
                    {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => {
                      setPlaying(false);
                      setLiveIndex(null);
                    }}
                    aria-label="Baştan Başlat"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex max-h-[420px] flex-col divide-y divide-border/60 overflow-y-auto">
                {workday.stops.map((stop, i) => (
                  <div key={stop.id} className="flex items-start gap-3 px-3.5 py-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                        i === 0 ? "bg-success" : i === workday.stops.length - 1 ? "bg-destructive" : "bg-primary",
                      )}
                    >
                      {i === 0 ? "B" : i === workday.stops.length - 1 ? "S" : i}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{stop.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {stop.arrivedAt ? `Varış ${formatTime(stop.arrivedAt)}` : "Başlangıç"}
                        {stop.departedAt ? ` · Ayrılış ${formatTime(stop.departedAt)}` : ""}
                      </p>
                      {stop.workOrderNo && <p className="text-[11px] text-primary">{stop.workOrderNo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="min-h-[420px] min-w-0 overflow-hidden rounded-2xl">
              <RouteMap stops={workday.stops} breadcrumbs={workday.breadcrumbs} liveIndex={liveIndex} />
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {formatDate(workday.date)} tarihli rota · {workday.breadcrumbs.length} konum kaydı
          </p>
        </>
      )}
      </>
      )}
    </div>
  );
}
