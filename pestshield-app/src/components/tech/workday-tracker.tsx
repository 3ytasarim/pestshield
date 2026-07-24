"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { AlertTriangle, MapPin, Play, RotateCw, Square } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { haversineKm, routeDistanceKm, type GeoPoint, type RouteStop } from "@/lib/mock/tracking";
import { cn } from "@/lib/utils";

const RouteMap = dynamic(() => import("@/components/tracking/route-map").then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">Harita yükleniyor…</div>,
});

const STORAGE_KEY = "pestshield.tech.workday.v1";
const PING_INTERVAL_MS = 5000;
// Wifi/hücre bazlı kaba konum tahminleri genelde 300m-birkaç km hata payı verir,
// gerçek GPS kilidi genelde <50m'dir — 150m üstü noktalar sessizce atlanır.
const MAX_ACCURACY_M = 150;
// Bir önceki noktadan bu hızın üzerinde bir sıçrama (GPS gürültüsü/kaba konum
// sıçraması) fiziksel olarak anlamsızdır — İstanbul trafiğinde otoyol dahil
// cömert bir üst sınır.
const MAX_PLAUSIBLE_SPEED_KMH = 150;
// Bunun altındaki sapmalar duran bir teknisyende bile normal GPS gürültüsüdür
// (birkaç metre) — rotaya "hareket" olarak eklenmez.
const MIN_DISPLACEMENT_M = 15;

type Status = "not_started" | "in_progress" | "completed";

interface StoredWorkday {
  status: Status;
  startedAt: string | null;
  endedAt: string | null;
  points: GeoPoint[];
}

function loadStored(): StoredWorkday {
  if (typeof window === "undefined") return { status: "not_started", startedAt: null, endedAt: null, points: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: "not_started", startedAt: null, endedAt: null, points: [] };
    const parsed = JSON.parse(raw) as StoredWorkday;
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.startedAt && !parsed.startedAt.startsWith(today)) {
      return { status: "not_started", startedAt: null, endedAt: null, points: [] };
    }
    return parsed;
  } catch {
    return { status: "not_started", startedAt: null, endedAt: null, points: [] };
  }
}

function elapsedLabel(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt) return "—";
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} sa ${m} dk`;
}

interface ServerWorkday {
  status: Status;
  startedAt: string;
  endedAt: string | null;
  pings: { lat: number; lng: number; recordedAt: string }[];
}

export function WorkdayTracker() {
  const [state, setState] = useState<StoredWorkday>(() => loadStored());
  const [geoError, setGeoError] = useState<string | null>(null);
  const [, forceTick] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // recordPoint() setInterval kapanışında state'i taze tutmak için — GPS
  // sıçrama kontrolü "son nokta"yı senkron okumak zorunda.
  const pointsRef = useRef<GeoPoint[]>(state.points);
  // Tek okumalık GPS sıçramaları (multipath/yansıma hatası) bir sonraki
  // okumada doğrulanana kadar rotaya eklenmez — bkz. recordPoint().
  const pendingPointRef = useRef<GeoPoint | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    pointsRef.current = state.points;
  }, [state.points]);

  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Tarayıcı reddetmiş olabilir (ör. sekme arka planda) - konum takibi
      // yine de devam eder, sadece ekran otomatik kilitlenebilir.
    }
  }

  async function releaseWakeLock() {
    try {
      await wakeLockRef.current?.release();
    } catch {
      // yoksay
    }
    wakeLockRef.current = null;
  }

  // Wake lock sekme gizlenince tarayıcı tarafından otomatik serbest bırakılır -
  // sekme tekrar görünür olduğunda (mesai hâlâ sürüyorsa) yeniden istenir.
  useEffect(() => {
    if (state.status !== "in_progress") return;
    function handleVisibility() {
      if (document.visibilityState === "visible") requestWakeLock();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.status]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Sunucudaki gunun mesai kaydini (varsa) kaynak olarak al - baska bir
  // cihaz/tarayicida "Mesaiye Basla" denmisse burada da devam edebilelim.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tech/workday")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { workday: ServerWorkday | null } | null) => {
        if (!data?.workday || cancelled) return;
        const w = data.workday;
        setState({
          status: w.status,
          startedAt: w.startedAt,
          endedAt: w.endedAt,
          points: w.pings.map((p) => ({ lat: p.lat, lng: p.lng, timestamp: p.recordedAt })),
        });
        if (w.status === "in_progress" && intervalRef.current === null) {
          intervalRef.current = setInterval(recordPoint, PING_INTERVAL_MS);
          requestWakeLock();
        }
      })
      .catch(() => {
        // Sunucuya ulasilamazsa yerelde kalinan yerden (varsa) devam edilir.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "in_progress") return;
    const tick = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(tick);
  }, [state.status]);

  useEffect(
    () => () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      releaseWakeLock();
    },
    [],
  );

  function recordPoint() {
    if (!("geolocation" in navigator)) {
      setGeoError("Bu tarayıcı konum servislerini desteklemiyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoError(null);

        // Wifi/hücre bazlı kaba konum tahmini — gerçek GPS kilidi gelene kadar
        // sessizce atla, rotayı bozmasın.
        if (pos.coords.accuracy && pos.coords.accuracy > MAX_ACCURACY_M) return;

        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toISOString(),
        };

        function commit(p: GeoPoint) {
          pointsRef.current = [...pointsRef.current, p];
          setState((prev) => ({ ...prev, points: pointsRef.current }));
          fetch("/api/tech/workday/ping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: p.lat, lng: p.lng }),
          }).catch(() => {
            // Baglanti yoksa nokta yerelde kalir; bir sonraki basarili ping'de senkron devam eder.
          });
        }

        const last = pointsRef.current[pointsRef.current.length - 1];
        if (!last) {
          commit(point);
          return;
        }

        const elapsedHours = (new Date(point.timestamp).getTime() - new Date(last.timestamp).getTime()) / 3_600_000;
        const impliedSpeedKmh = elapsedHours > 0 ? haversineKm(last, point) / elapsedHours : 0;
        // Fiziksel olarak imkansız bir sıçrama — GPS gürültüsü, reddedilir.
        if (impliedSpeedKmh > MAX_PLAUSIBLE_SPEED_KMH) {
          pendingPointRef.current = null;
          return;
        }

        const displacementFromLastM = haversineKm(last, point) * 1000;
        if (displacementFromLastM < MIN_DISPLACEMENT_M) {
          // Hâlâ aynı yerde — bekleyen adaydan bağımsız, bu tek okumalık bir
          // sapmaydı, doğrulanmadı.
          pendingPointRef.current = null;
          return;
        }

        if (!pendingPointRef.current) {
          // İlk kez bu kadar uzağa sıçradı — hemen rotaya çizme, bir sonraki
          // okumada doğrulanmasını bekle.
          pendingPointRef.current = point;
          return;
        }

        const displacementFromPendingM = haversineKm(pendingPointRef.current, point) * 1000;
        if (displacementFromPendingM < MIN_DISPLACEMENT_M) {
          // İki ardışık okuma da aynı yeni konumda hemfikir — gerçek hareket.
          commit(pendingPointRef.current);
          commit(point);
          pendingPointRef.current = null;
        } else {
          // Bekleyen aday doğrulanmadı (tek okumalık gürültüydü) — atılır,
          // bu nokta yeni aday olarak tutulur.
          pendingPointRef.current = point;
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED && typeof window !== "undefined" && !window.isSecureContext) {
          setGeoError(
            "Konum servisi yalnızca güvenli (HTTPS) bağlantılarda çalışır. Yerel ağ üzerinden (http://) test ediyorsanız bu beklenen bir durumdur — canlıya alındığında (HTTPS) sorunsuz çalışacaktır.",
          );
          return;
        }
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Konum izni reddedildi. Rota takibi için tarayıcı/telefon ayarlarından konum iznini etkinleştirin."
            : "Konum alınamadı. GPS sinyali zayıf olabilir.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 },
    );
  }

  function startWork() {
    if (!("geolocation" in navigator)) {
      setGeoError("Bu tarayıcı konum servislerini desteklemiyor.");
      toast.error("Konum servisi bulunamadı");
      return;
    }
    const startedAt = new Date().toISOString();
    // pointsRef senkron sıfırlanır - hemen aşağıda çağrılan recordPoint() henüz
    // commit edilmemiş state'i değil, boş listeyi "son nokta" olarak görmeli.
    pointsRef.current = [];
    pendingPointRef.current = null;
    setState({ status: "in_progress", startedAt, endedAt: null, points: [] });
    fetch("/api/tech/workday", { method: "POST" }).catch(() => {
      // Sunucuya ulasilamazsa mesai yerelde devam eder; ping'ler sonraki senkronda gonderilir.
    });
    recordPoint();
    intervalRef.current = setInterval(recordPoint, PING_INTERVAL_MS);
    requestWakeLock();
    toast.success("İş günü başladı — konumunuz her 5 saniyede bir kaydediliyor");
  }

  function endWork() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
    releaseWakeLock();
    setState((prev) => ({ ...prev, status: "completed", endedAt: new Date().toISOString() }));
    fetch("/api/tech/workday/end", { method: "POST" }).catch(() => {
      // Sunucuya ulasilamazsa yerel durum "completed" olarak kalir.
    });
    toast.success("İş günü sonlandırıldı");
  }

  function resetDemo() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    releaseWakeLock();
    pointsRef.current = [];
    pendingPointRef.current = null;
    setState({ status: "not_started", startedAt: null, endedAt: null, points: [] });
    setGeoError(null);
  }

  const distance = routeDistanceKm(state.points);
  const lastPoint = state.points[state.points.length - 1] ?? null;

  const mapStops: RouteStop[] =
    state.points.length > 0
      ? [
          {
            id: "start",
            label: "Başlangıç",
            customerId: null,
            lat: state.points[0].lat,
            lng: state.points[0].lng,
            arrivedAt: null,
            departedAt: state.startedAt,
            workOrderNo: null,
          },
          {
            id: "current",
            label: "Son Konum",
            customerId: null,
            lat: lastPoint!.lat,
            lng: lastPoint!.lng,
            arrivedAt: lastPoint!.timestamp,
            departedAt: null,
            workOrderNo: null,
          },
        ]
      : [];

  return (
    <div className="flex flex-col gap-4">
      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                state.status === "in_progress"
                  ? "bg-success/10 text-success"
                  : state.status === "completed"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {state.status === "in_progress" && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
              )}
              {state.status === "not_started" ? "Mesai Dışı" : state.status === "in_progress" ? "Sahadasınız" : "Mesai Tamamlandı"}
            </span>
            {state.status !== "not_started" && (
              <button
                type="button"
                onClick={resetDemo}
                aria-label="Yeni gün başlat"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <RotateCw className="size-4" />
              </button>
            )}
          </div>

          {state.status === "not_started" && (
            <Button
              size="lg"
              onClick={startWork}
              className="h-14 w-full rounded-xl bg-success text-base text-success-foreground hover:bg-success/90"
            >
              <Play className="size-4.5 fill-current" />
              Mesaiye Başla
            </Button>
          )}
          {state.status === "in_progress" && (
            <Button
              size="lg"
              onClick={endWork}
              className="h-14 w-full rounded-xl bg-destructive text-base text-white hover:bg-destructive/90"
            >
              <Square className="size-4.5 fill-current" />
              Mesaiyi Sonlandır
            </Button>
          )}
          {state.status === "completed" && (
            <div className="rounded-xl bg-muted/40 px-3.5 py-3 text-center text-sm text-muted-foreground">
              Bugünkü mesainiz tamamlandı. Yarın tekrar başlayabilirsiniz.
            </div>
          )}

          {geoError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {geoError}
            </div>
          )}

          {state.status !== "not_started" && (
            <div className="grid grid-cols-3 gap-3 border-t border-border/60 pt-3.5 text-center">
              <div>
                <p className="text-lg font-bold tabular-nums">{elapsedLabel(state.startedAt, state.endedAt)}</p>
                <p className="text-xs text-muted-foreground">Süre</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{distance} km</p>
                <p className="text-xs text-muted-foreground">Kat Edilen Mesafe</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{state.points.length}</p>
                <p className="text-xs text-muted-foreground">Konum Kaydı</p>
              </div>
            </div>
          )}

          {lastPoint && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              Son konum: {lastPoint.lat.toFixed(5)}, {lastPoint.lng.toFixed(5)} · {new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(lastPoint.timestamp))}
            </p>
          )}
        </CardContent>
      </Card>

      {state.points.length > 0 && (
        <div className="min-h-[260px] overflow-hidden rounded-2xl">
          <RouteMap stops={mapStops} breadcrumbs={state.points} />
        </div>
      )}
    </div>
  );
}
