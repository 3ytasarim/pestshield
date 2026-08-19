"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import jsQR from "jsqr";
import { toast } from "sonner";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, MapPin, QrCode, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { stationColor, stationLabel } from "@/components/crm/kroki-constants";
import {
  TUKETIM_OPTIONS,
  HAREKET_OPTIONS,
  RODENT_TUR_OPTIONS,
  OTHER_PEST_TUR_OPTIONS,
  DEGISIM_OPTIONS,
  UCKUN_TUR_OPTIONS,
  FLORASAN_OPTIONS,
} from "@/components/crm/istasyon-inspection-constants";
import type { KrokiStationType, StationInspection } from "@/lib/mock/crm";

type CameraState = "idle" | "starting" | "running" | "denied" | "unsupported";

interface ResolvedStation {
  id: string;
  type: KrokiStationType;
  number: number | null;
  stationId: string;
  krokiSketchId: string;
  sketchName: string;
  serviceOrderId: string;
  serviceName: string;
  customer: { id: string; companyName: string } | null;
}

function extractStationId(raw: string): string | null {
  try {
    const url = new URL(raw);
    const id = url.searchParams.get("stationId");
    if (id) return id;
  } catch {
    // raw değer bir URL değil, doğrudan id olarak dene
  }
  return raw.trim() || null;
}

function emptyInspection(station: ResolvedStation, occurrenceId: string): StationInspection {
  return {
    id: `insp-${occurrenceId}-${station.id}`,
    periyotOccurrenceId: occurrenceId,
    krokiSketchId: station.krokiSketchId,
    krokiStationId: station.id,
    stationType: station.type,
    tuketim: "",
    hareket: "",
    tur1: "",
    tur2: "",
    degisim: "",
    tur: "",
    sayim: "",
    olcum: "",
    florasanDurumu: "",
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string | undefined; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      <Select value={value || "-"} onValueChange={(v) => onChange(v === "-" ? "" : String(v))}>
        <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
          <SelectValue>{() => value || "Seçiniz…"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="-">-</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function StationScanPage({ technicianName }: { technicianName: string }) {
  const searchParams = useSearchParams();
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [manualCode, setManualCode] = useState("");
  const [resolving, setResolving] = useState(false);
  const [station, setStation] = useState<ResolvedStation | null>(null);
  const [occurrenceId, setOccurrenceId] = useState<string | null>(null);
  const [inspection, setInspection] = useState<StationInspection | null>(null);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resolveStation = useCallback(
    async (stationId: string) => {
      setResolving(true);
      try {
        const stationRes = await fetch(`/api/crm/kroki-stations/${stationId}`);
        const stationData = await stationRes.json().catch(() => ({}));
        if (!stationRes.ok || !stationData.station) {
          toast.error(stationData.message ?? "İstasyon bulunamadı");
          return;
        }
        const resolved: ResolvedStation = stationData.station;
        if (!resolved.customer) {
          toast.error("Bu istasyonun müşteri bilgisi bulunamadı");
          return;
        }

        const today = todayIso();
        let occId: string | null = null;
        const occRes = await fetch(
          `/api/crm/periyot/occurrences?serviceOrderId=${resolved.serviceOrderId}&periodDate=${today}`,
        );
        const occData = await occRes.json().catch(() => ({}));
        const existingOcc = occData.occurrences?.[0];
        if (existingOcc) {
          occId = existingOcc.id;
        } else {
          const batchRes = await fetch(`/api/crm/periyot/batches?serviceOrderId=${resolved.serviceOrderId}`);
          const batchData = await batchRes.json().catch(() => ({}));
          const batch = batchData.batches?.[0];
          if (!batch) {
            toast.error("Bu hizmete ait bir periyot planı bulunamadı — önce ofisten periyot tanımlanmalı");
            return;
          }
          const createRes = await fetch("/api/crm/periyot/occurrences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              batchId: batch.id,
              serviceOrderId: resolved.serviceOrderId,
              customerId: resolved.customer.id,
              personnelName: technicianName,
              periodDate: today,
              startTime: "",
              endTime: "",
            }),
          });
          const createData = await createRes.json().catch(() => ({}));
          if (!createRes.ok || !createData.occurrence) {
            toast.error(createData.message ?? "Bugünün ziyareti oluşturulamadı");
            return;
          }
          occId = createData.occurrence.id;
        }

        const inspRes = await fetch(`/api/crm/periyot/occurrences/${occId}/station-inspections`);
        const inspData = await inspRes.json().catch(() => ({}));
        const existing: StationInspection[] = inspData.inspections ?? [];
        const found = existing.find((i) => i.krokiStationId === resolved.id);

        setStation(resolved);
        setOccurrenceId(occId);
        setInspection(found ?? emptyInspection(resolved, occId!));
        stopCamera();
        setCameraState("idle");
        toast.success(`${resolved.stationId || `İstasyon ${resolved.number ?? ""}`} bulundu`);
      } finally {
        setResolving(false);
      }
    },
    [technicianName, stopCamera],
  );

  useEffect(() => {
    const stationId = searchParams.get("stationId");
    if (stationId) resolveStation(stationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);
    if (result?.data) {
      const stationId = extractStationId(result.data);
      if (stationId) {
        resolveStation(stationId);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  async function startCamera() {
    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      setCameraState("unsupported");
      return;
    }
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("running");
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraState("denied");
    }
  }

  function updateField(patch: Partial<StationInspection>) {
    setInspection((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleSave() {
    if (!station || !occurrenceId || !inspection) return;
    setSaving(true);
    try {
      const inspRes = await fetch(`/api/crm/periyot/occurrences/${occurrenceId}/station-inspections`);
      const inspData = await inspRes.json().catch(() => ({}));
      const existing: StationInspection[] = inspData.inspections ?? [];
      const merged = [...existing.filter((i) => i.krokiStationId !== station.id), inspection];

      const res = await fetch(`/api/crm/periyot/occurrences/${occurrenceId}/station-inspections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspections: merged.map((i) => ({
            krokiSketchId: i.krokiSketchId,
            krokiStationId: i.krokiStationId,
            stationType: i.stationType,
            tuketim: i.tuketim,
            hareket: i.hareket,
            tur1: i.tur1,
            tur2: i.tur2,
            degisim: i.degisim,
            tur: i.tur,
            sayim: i.sayim,
            olcum: i.olcum,
            florasanDurumu: i.florasanDurumu,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Kayıt kaydedilemedi");
        return;
      }
      toast.success("İstasyon denetimi kaydedildi");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStation(null);
    setOccurrenceId(null);
    setInspection(null);
  }

  if (resolving) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-sm text-muted-foreground">
        <QrCode className="size-8 animate-pulse text-primary" />
        İstasyon bulunuyor…
      </div>
    );
  }

  if (station && inspection) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">İstasyon Denetimi</h1>
          <Button variant="outline" size="sm" onClick={reset}>
            Başka İstasyon Tara
          </Button>
        </div>

        <Card className={GLASS_CARD}>
          <CardContent className="flex items-center gap-3 py-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${stationColor(station.type)}1a`, color: stationColor(station.type) }}
            >
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {station.stationId || (station.number != null ? `İstasyon ${station.number}` : "İstasyon")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {station.customer?.companyName} · {stationLabel(station.type)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={GLASS_CARD}>
          <CardContent className="flex flex-col gap-3.5">
            <p className="text-sm font-semibold text-foreground">Denetim Kaydı</p>

            {station.type === "zehirli" && (
              <FieldSelect label="Tüketim" value={inspection.tuketim} onChange={(v) => updateField({ tuketim: v })} options={TUKETIM_OPTIONS} />
            )}

            {station.type === "zehirsiz" && (
              <>
                <FieldSelect label="Hareket" value={inspection.hareket} onChange={(v) => updateField({ hareket: v })} options={HAREKET_OPTIONS} />
                <FieldSelect label="Tür" value={inspection.tur1} onChange={(v) => updateField({ tur1: v })} options={RODENT_TUR_OPTIONS} />
                <FieldSelect label="Tür (Diğer)" value={inspection.tur2} onChange={(v) => updateField({ tur2: v })} options={OTHER_PEST_TUR_OPTIONS} />
              </>
            )}

            {(station.type === "ic_uckun" || station.type === "dis_uckun") && (
              <>
                <FieldSelect label="Değişim" value={inspection.degisim} onChange={(v) => updateField({ degisim: v })} options={DEGISIM_OPTIONS} />
                <FieldSelect label="Tür" value={inspection.tur} onChange={(v) => updateField({ tur: v })} options={UCKUN_TUR_OPTIONS} />
                <div>
                  <Label className="mb-1.5">Sayım</Label>
                  <Input type="number" value={inspection.sayim} onChange={(e) => updateField({ sayim: e.target.value })} className="h-11 rounded-xl px-3.5" />
                </div>
                {station.type === "ic_uckun" && (
                  <>
                    <div>
                      <Label className="mb-1.5">Ölçüm</Label>
                      <Input type="number" value={inspection.olcum} onChange={(e) => updateField({ olcum: e.target.value })} className="h-11 rounded-xl px-3.5" />
                    </div>
                    <FieldSelect
                      label="Floresan Durumu"
                      value={inspection.florasanDurumu}
                      onChange={(v) => updateField({ florasanDurumu: v })}
                      options={FLORASAN_OPTIONS}
                    />
                  </>
                )}
              </>
            )}

            <Button onClick={handleSave} loading={saving}>
              <CheckCircle2 className="size-4" />
              Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">QR Kontrol</h1>
        <p className="text-sm text-muted-foreground">İstasyon etiketini okutun veya kodu elle girin.</p>
      </div>

      <Card className={GLASS_CARD}>
        <CardContent className="flex flex-col gap-3">
          {cameraState === "running" ? (
            <div className="relative overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-3 right-3 bg-background/90"
                onClick={() => {
                  stopCamera();
                  setCameraState("idle");
                }}
              >
                <CameraOff className="size-3.5" />
                Durdur
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 py-10 text-center">
              <Camera className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Kamera ile QR Tara</p>
                <p className="text-xs text-muted-foreground">İstasyon etiketini kameraya gösterin</p>
              </div>
              <Button onClick={startCamera} loading={cameraState === "starting"}>
                <Camera className="size-4" />
                Kamerayı Başlat
              </Button>
              {cameraState === "denied" && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="size-3.5" />
                  Kamera izni reddedildi. Tarayıcı/telefon ayarlarından izin verin veya kodu elle girin.
                </p>
              )}
              {cameraState === "unsupported" && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="size-3.5" />
                  Bu cihaz/tarayıcı kamera erişimini desteklemiyor.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">veya</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="İstasyon kodu"
                className="h-11 rounded-xl pl-9 font-mono"
                onKeyDown={(e) => e.key === "Enter" && manualCode && resolveStation(manualCode)}
              />
            </div>
            <Button variant="outline" onClick={() => manualCode && resolveStation(manualCode)}>
              <Search className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
