"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import jsQR from "jsqr";
import { toast } from "sonner";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, QrCode, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { StationStatusBadge, ActivityLevelBadge } from "@/components/operations/operations-badges";
import { STATION_TYPE_LABELS } from "@/components/operations/operations-labels";
import type { Station, ActivityLevel, StationCheck } from "@/lib/mock/operations";
import { cn } from "@/lib/utils";

interface StationWithCustomer extends Station {
  customer: { id: string; companyName: string } | null;
}

type CameraState = "idle" | "starting" | "running" | "denied" | "unsupported";

function extractCode(raw: string): string | null {
  try {
    const url = new URL(raw);
    const code = url.searchParams.get("code");
    if (code) return code;
  } catch {
    // raw değer bir URL değil, doğrudan kod olarak dene
  }
  const match = raw.match(/PS-STN-\d+/);
  return match ? match[0] : raw.trim() || null;
}

export function StationScanPage() {
  const searchParams = useSearchParams();
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [manualCode, setManualCode] = useState("");
  const [activeStation, setActiveStation] = useState<StationWithCustomer | null>(null);
  const [localChecks, setLocalChecks] = useState<StationCheck[]>([]);
  const [activityFound, setActivityFound] = useState(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("none");
  const [actionTaken, setActionTaken] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const selectStation = useCallback(async (code: string) => {
    const res = await fetch(`/api/crm/stations?qrCode=${encodeURIComponent(code)}`);
    const data = await res.json();
    const station = data.stations?.[0] as StationWithCustomer | undefined;
    if (!station) {
      toast.error(`"${code}" için istasyon bulunamadı`);
      return;
    }
    setActiveStation(station);
    const checksRes = await fetch(`/api/crm/stations/${station.id}/checks`);
    const checksData = await checksRes.json();
    setLocalChecks(checksData.checks ?? []);
    setActivityFound(false);
    setActivityLevel("none");
    setActionTaken("");
    setNote("");
    stopCamera();
    setCameraState("idle");
    toast.success(`${station.label} bulundu`);
  }, [stopCamera]);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) selectStation(code);
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
      const code = extractCode(result.data);
      if (code) {
        selectStation(code);
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

  const stationChecksList = useMemo(() => localChecks, [localChecks]);
  const customer = activeStation?.customer ?? null;

  async function submitCheck() {
    if (!activeStation) return;
    if (!actionTaken.trim()) {
      toast.error("Yapılan işlemi girin");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/crm/stations/${activeStation.id}/checks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityFound, activityLevel, actionTaken, note }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message ?? "Kontrol kaydedilemedi");
      setSubmitting(false);
      return;
    }
    const data = await res.json();
    setLocalChecks((prev) => [data.check, ...prev]);
    setActiveStation((prev) =>
      prev ? { ...prev, lastCheckDate: data.check.checkedAt.slice(0, 10), status: activityFound ? "needs_attention" : "active" } : prev,
    );
    toast.success("Kontrol kaydedildi");
    setActivityFound(false);
    setActivityLevel("none");
    setActionTaken("");
    setNote("");
    setSubmitting(false);
  }

  if (activeStation) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">İstasyon Kontrolü</h1>
          <Button variant="outline" size="sm" onClick={() => setActiveStation(null)}>
            Başka İstasyon Tara
          </Button>
        </div>

        <Card className={GLASS_CARD}>
          <CardContent className="flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{activeStation.label}</p>
                <p className="text-xs text-muted-foreground">
                  {customer?.companyName} · {STATION_TYPE_LABELS[activeStation.type]}
                </p>
              </div>
              <StationStatusBadge status={activeStation.status} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">{activeStation.qrCode}</p>
            <p className="text-xs text-muted-foreground">Son kontrol: {formatDate(activeStation.lastCheckDate)}</p>
          </CardContent>
        </Card>

        <Card className={GLASS_CARD}>
          <CardContent className="flex flex-col gap-3.5">
            <p className="text-sm font-semibold text-foreground">Yeni Kontrol Kaydı</p>

            <div>
              <Label className="mb-1.5">Aktivite Tespit Edildi mi?</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivityFound(false)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    !activityFound ? "border-success/30 bg-success/10 text-success" : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  Hayır
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFound(true)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    activityFound ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  Evet
                </button>
              </div>
            </div>

            {activityFound && (
              <div>
                <Label className="mb-1.5">Aktivite Seviyesi</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["low", "medium", "high"] as ActivityLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setActivityLevel(level)}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                        activityLevel === level ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <ActivityLevelBadge level={level} className="pointer-events-none" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="mb-1.5">Yapılan İşlem</Label>
              <Input value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Yem yenilendi, tuzak değiştirildi…" className="h-11 rounded-xl px-3.5" />
            </div>

            <div>
              <Label className="mb-1.5">Not (opsiyonel)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-xl px-3.5 py-2.5" />
            </div>

            <Button onClick={submitCheck} loading={submitting}>
              <CheckCircle2 className="size-4" />
              Kontrolü Kaydet
            </Button>
          </CardContent>
        </Card>

        {stationChecksList.length > 0 && (
          <Card className={GLASS_CARD}>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">Geçmiş Kontroller</p>
              <div className="flex flex-col divide-y divide-border/60">
                {stationChecksList.slice(0, 5).map((check) => (
                  <div key={check.id} className="flex items-start justify-between gap-2 py-2.5 text-xs">
                    <div>
                      <p className="font-medium text-foreground">{check.actionTaken}</p>
                      <p className="text-muted-foreground">
                        {check.technicianName} · {formatDate(check.checkedAt)}
                      </p>
                    </div>
                    <ActivityLevelBadge level={check.activityLevel} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
                placeholder="PS-STN-000123"
                className="h-11 rounded-xl pl-9 font-mono"
                onKeyDown={(e) => e.key === "Enter" && manualCode && selectStation(manualCode)}
              />
            </div>
            <Button variant="outline" onClick={() => manualCode && selectStation(manualCode)}>
              <Search className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
