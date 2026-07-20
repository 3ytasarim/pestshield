"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GLASS_CARD } from "@/components/dashboard/shared";
import type { LicenseStatus } from "@/lib/license";
import type { LicenseType } from "@/generated/prisma";

interface LicenseStatusResponse {
  licenseType: LicenseType | null;
  licenseExpiresAt: string | null;
  daysRemaining: number | null;
  status: LicenseStatus;
}

const TYPE_LABEL: Record<LicenseType, string> = {
  DEMO: "5 Günlük Deneme",
  MONTHLY: "Aylık",
  YEARLY: "Yıllık",
};

const STATUS_META: Record<
  LicenseStatus,
  { label: string; variant: "outline" | "destructive" | "secondary"; icon: typeof ShieldCheck }
> = {
  NONE: { label: "Lisans Yok", variant: "outline", icon: ShieldAlert },
  ACTIVE: { label: "Aktif", variant: "secondary", icon: ShieldCheck },
  EXPIRING_SOON: { label: "Yakında Doluyor", variant: "outline", icon: ShieldAlert },
  EXPIRED: { label: "Süresi Doldu", variant: "destructive", icon: ShieldX },
};

export function LicensePage() {
  const [status, setStatus] = useState<LicenseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/license/status");
      const data = await res.json();
      if (res.ok) setStatus(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleApply() {
    if (!code.trim()) {
      toast.error("Lütfen bir lisans kodu girin");
      return;
    }
    setApplying(true);
    try {
      const res = await fetch("/api/license/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Lisans kodu uygulanamadı");
        return;
      }
      setStatus(data);
      setCode("");
      toast.success("Lisans başarıyla uygulandı");
      window.dispatchEvent(new Event("pestshield:license-updated"));
    } catch {
      toast.error("Lisans kodu uygulanamadı");
    } finally {
      setApplying(false);
    }
  }

  const meta = status ? STATUS_META[status.status] : null;
  const StatusIcon = meta?.icon ?? ShieldAlert;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Lisans</h1>
        <p className="text-sm text-muted-foreground">
          Mevcut lisans durumunuz ve yeni bir lisans kodu uygulama ekranı.
        </p>
      </div>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <StatusIcon className="size-4 text-primary" />
            Mevcut Lisans Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant={meta?.variant}>{meta?.label}</Badge>
              <span className="text-sm text-muted-foreground">
                Tür: <b className="text-foreground">{status?.licenseType ? TYPE_LABEL[status.licenseType] : "—"}</b>
              </span>
              <span className="text-sm text-muted-foreground">
                Kalan Süre:{" "}
                <b className="text-foreground">
                  {status?.daysRemaining === null || status?.daysRemaining === undefined
                    ? "—"
                    : `${status.daysRemaining} gün`}
                </b>
              </span>
              {status?.licenseExpiresAt && (
                <span className="text-sm text-muted-foreground">
                  Bitiş:{" "}
                  <b className="text-foreground">
                    {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(
                      new Date(status.licenseExpiresAt),
                    )}
                  </b>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={GLASS_CARD}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-primary" />
            Lisans Kodu Uygula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Lisans Kodu</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PSF-XXXX-XXXX-XXXX"
                className="font-mono"
              />
            </div>
            <Button onClick={handleApply} loading={applying}>
              <CheckCircle2 className="size-4" />
              Uygula
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            PestShield tarafından size iletilen lisans kodunu yukarıya yapıştırıp &quot;Uygula&quot;ya
            basın.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
