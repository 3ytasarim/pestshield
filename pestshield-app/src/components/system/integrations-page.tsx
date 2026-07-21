"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Info,
  Mail,
  Plug,
  Receipt,
  RefreshCw,
  Send,
  Smartphone,
  Unlink,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { cn } from "@/lib/utils";
import type { SmtpEncryption } from "@/lib/validations/integrations";

const COMING_SOON = [
  { icon: FileSpreadsheet, title: "e-Fatura / e-Arşiv", description: "GİB entegrasyonu ile faturalar otomatik e-Fatura/e-Arşiv olarak kesilsin." },
  { icon: Smartphone, title: "SMS Gateway", description: "Servis hatırlatma ve tahsilat bildirimleri SMS ile gönderilsin (Netgsm, İleti Merkezi vb.)." },
];

interface GoogleCalendarStatus {
  connected: boolean;
  configured?: boolean;
  calendarId?: string;
  calendarName?: string | null;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncCount?: number;
}

interface GoogleCalendarEntry {
  id: string;
  summary: string;
  primary?: boolean;
}

function GoogleCalendarCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState<GoogleCalendarEntry[]>([]);
  const [switching, setSwitching] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/google-calendar");
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        const calRes = await fetch("/api/integrations/google-calendar/calendars");
        const calData = await calRes.json();
        if (calRes.ok) setCalendars(calData.calendars ?? []);
      }
    } catch {
      toast.error("Google Calendar bağlantı durumu alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const result = searchParams.get("googleCalendar");
    if (!result) return;
    if (result === "connected") {
      toast.success("Google Calendar bağlantısı kuruldu");
      loadStatus();
    } else if (result === "error") {
      const reason = searchParams.get("reason");
      toast.error(reason === "state_mismatch" ? "Bağlantı doğrulanamadı, tekrar deneyin" : "Google Calendar bağlantısı kurulamadı");
    }
    router.replace("/dashboard/client/integrations");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleConnect() {
    window.location.href = "/api/integrations/google-calendar/authorize";
  }

  async function handleSelectCalendar(calendarId: string) {
    const calendar = calendars.find((c) => c.id === calendarId);
    if (!calendar) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/integrations/google-calendar/select-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: calendar.id, calendarName: calendar.summary }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Takvim seçilemedi");
        return;
      }
      toast.success("Senkronize edilecek takvim güncellendi");
      await loadStatus();
    } catch {
      toast.error("Takvim seçilemedi — sunucuya ulaşılamadı");
    } finally {
      setSwitching(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/google-calendar/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Senkronizasyon başarısız oldu");
        return;
      }
      toast.success(`Senkronizasyon tamamlandı — ${data.synced} iş emri`);
      await loadStatus();
    } catch {
      toast.error("Senkronizasyon başarısız oldu — sunucuya ulaşılamadı");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    try {
      await fetch("/api/integrations/google-calendar", { method: "DELETE" });
      setCalendars([]);
      toast.success("Bağlantı kesildi");
      await loadStatus();
    } catch {
      toast.error("Bağlantı kesilemedi");
    }
  }

  return (
    <Card className={cn(GLASS_CARD, "rounded-2xl")}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Google Calendar</p>
              <p className="text-xs text-muted-foreground">İş emirleri otomatik olarak takvime senkronize edilsin.</p>
            </div>
          </div>
          {status.connected ? (
            <Badge variant="outline" className="gap-1 rounded-full border-success/20 bg-success/10 text-success">
              <CheckCircle2 className="size-3" />
              Bağlı
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full border-border bg-muted text-muted-foreground">
              Bağlı Değil
            </Badge>
          )}
        </div>

        {loading ? null : status.connected ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Senkronize Takvim</p>
                <p className="mt-0.5 truncate text-foreground">{status.calendarName ?? status.calendarId}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Son Senkronizasyon</p>
                <p className="mt-0.5 truncate text-foreground">
                  {status.lastSyncAt ? formatDate(status.lastSyncAt) : "Henüz yapılmadı"}
                  {typeof status.lastSyncCount === "number" && status.lastSyncCount > 0 ? ` · ${status.lastSyncCount} kayıt` : ""}
                </p>
              </div>
            </div>
            {status.lastSyncStatus && status.lastSyncStatus.startsWith("error") && (
              <p className="text-xs text-destructive">Son senkronizasyon hatası: {status.lastSyncStatus.replace(/^error:\s*/, "")}</p>
            )}
            {calendars.length > 0 && (
              <div>
                <Label className="mb-1.5">Senkronize Edilecek Takvim</Label>
                <Select value={status.calendarId} onValueChange={(v) => v && handleSelectCalendar(v)} disabled={switching}>
                  <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                    <SelectValue placeholder="Takvim seçiniz">
                      {() => calendars.find((c) => c.id === status.calendarId)?.summary ?? status.calendarName ?? status.calendarId}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.summary}
                        {c.primary ? " (Birincil)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" loading={syncing} onClick={handleSyncNow} className="w-fit">
                <RefreshCw className="size-4" />
                Şimdi Senkronize Et
              </Button>
              <Button variant="outline" onClick={handleDisconnect} className="w-fit">
                <Unlink className="size-4" />
                Bağlantıyı Kes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-foreground/80">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="min-w-0">
                Google hesabınızla bağlanın — iş emirleri planlandığında/güncellendiğinde otomatik olarak seçtiğiniz Google
                Takvim&apos;e yazılır.
              </p>
            </div>
            {!status.configured && (
              <p className="text-xs text-destructive">
                Sunucu tarafında Google OAuth henüz yapılandırılmadı (GOOGLE_OAUTH_CLIENT_ID/SECRET eksik).
              </p>
            )}
            <Button onClick={handleConnect} disabled={!status.configured} className="w-fit">
              <Plug className="size-4" />
              Google ile Bağlan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface WhatsAppStatus {
  connected: boolean;
  phoneNumberId?: string;
  businessAccountId?: string | null;
  apiVersion?: string;
  connectedAt?: string | null;
}

function WhatsAppCard() {
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/whatsapp");
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("WhatsApp bağlantı durumu alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleConnect() {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      toast.error("Phone Number ID ve Access Token zorunludur");
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: phoneNumberId.trim(),
          accessToken: accessToken.trim(),
          businessAccountId: businessAccountId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "WhatsApp'a bağlanılamadı");
        return;
      }
      toast.success("WhatsApp Business API bağlantısı kuruldu");
      setPhoneNumberId("");
      setAccessToken("");
      setBusinessAccountId("");
      await loadStatus();
    } catch {
      toast.error("WhatsApp'a bağlanılamadı — sunucuya ulaşılamadı");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      await fetch("/api/integrations/whatsapp", { method: "DELETE" });
      toast.success("Bağlantı kesildi");
      await loadStatus();
    } catch {
      toast.error("Bağlantı kesilemedi");
    }
  }

  return (
    <Card className={cn(GLASS_CARD, "rounded-2xl")}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
              <WhatsAppIcon className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">WhatsApp Business API</p>
              <p className="text-xs text-muted-foreground">İş emri bildirimleri Meta WhatsApp Cloud API ile otomatik gönderilsin.</p>
            </div>
          </div>
          {status.connected ? (
            <Badge variant="outline" className="gap-1 rounded-full border-success/20 bg-success/10 text-success">
              <CheckCircle2 className="size-3" />
              Bağlı
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full border-border bg-muted text-muted-foreground">
              Bağlı Değil
            </Badge>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-foreground/80">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="min-w-0">
            Meta yalnızca <span className="font-medium">önceden onaylanmış şablon mesajları</span> göndermeye izin verir —
            serbest metin gönderilemez. Aşağıya bağladığınız Access Token sunucu tarafında şifreli saklanır; İçerik
            Şablonları sayfasında yazacağınız WhatsApp metni bir önizlemedir, gerçek gönderim için o metnin Meta Business
            Manager&apos;da aynı adla onaylı bir şablon olarak da tanımlı olması gerekir.
          </p>
        </div>

        {loading ? null : status.connected ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Phone Number ID</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{status.phoneNumberId}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">API Sürümü</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{status.apiVersion}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Bağlantı tarihi: {formatDate(status.connectedAt ?? null)}</p>
            <Button variant="outline" onClick={handleDisconnect} className="w-fit">
              <Unlink className="size-4" />
              Bağlantıyı Kes
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div>
              <Label className="mb-1.5">Phone Number ID</Label>
              <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="123456789012345" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
            </div>
            <div>
              <Label className="mb-1.5">Access Token</Label>
              <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="••••••••••••" className="h-11 rounded-xl px-3.5" />
            </div>
            <div>
              <Label className="mb-1.5">Business Account ID (opsiyonel)</Label>
              <Input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} placeholder="1234567890" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
            </div>
            <Button onClick={handleConnect} loading={connecting} className="w-fit">
              <Plug className="size-4" />
              Bağlan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ENCRYPTION_OPTIONS: { value: SmtpEncryption; label: string }[] = [
  { value: "tls", label: "TLS (STARTTLS)" },
  { value: "ssl", label: "SSL" },
  { value: "none", label: "Yok" },
];

interface SmtpStatus {
  connected: boolean;
  host?: string;
  port?: number;
  encryption?: SmtpEncryption;
  username?: string | null;
  fromName?: string | null;
  fromEmail?: string;
  connectedAt?: string | null;
}

function MailSettingsCard() {
  const [status, setStatus] = useState<SmtpStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [requiresAuth, setRequiresAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<SmtpEncryption>("tls");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/smtp");
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("SMTP bağlantı durumu alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleSave() {
    const authOk = !requiresAuth || (username.trim() && password.trim());
    if (!host.trim() || !port.trim() || !authOk || !fromEmail.trim()) {
      toast.error("Tüm zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/smtp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: host.trim(),
          port: Number(port),
          encryption,
          username: requiresAuth ? username.trim() : undefined,
          password: requiresAuth ? password : undefined,
          fromName: fromName.trim() || undefined,
          fromEmail: fromEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Mail ayarları kaydedilemedi");
        return;
      }
      toast.success("Mail ayarları kaydedildi");
      setHost("");
      setPort("587");
      setUsername("");
      setPassword("");
      setFromName("");
      setFromEmail("");
      await loadStatus();
    } catch {
      toast.error("Mail ayarları kaydedilemedi — sunucuya ulaşılamadı");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    try {
      await fetch("/api/integrations/smtp", { method: "DELETE" });
      setTestEmail("");
      toast.success("Bağlantı kesildi");
      await loadStatus();
    } catch {
      toast.error("Bağlantı kesilemedi");
    }
  }

  async function handleSendTestMail() {
    if (!testEmail.trim()) {
      toast.error("Test e-postası göndermek için bir alıcı adresi girin");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/integrations/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testEmail.trim() }),
      });
      const data: { message: string } = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || "Test e-postası gönderilemedi");
      }
    } catch {
      toast.error("Test e-postası gönderilemedi — sunucuya ulaşılamadı");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className={cn(GLASS_CARD, "rounded-2xl")}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Mail Ayarları (SMTP)</p>
              <p className="text-xs text-muted-foreground">Servis raporları, hatırlatma ve bildirim e-postaları bu SMTP sunucusu üzerinden gönderilsin.</p>
            </div>
          </div>
          {status.connected ? (
            <Badge variant="outline" className="gap-1 rounded-full border-success/20 bg-success/10 text-success">
              <CheckCircle2 className="size-3" />
              Bağlı
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full border-border bg-muted text-muted-foreground">
              Bağlı Değil
            </Badge>
          )}
        </div>

        {loading ? null : status.connected ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">SMTP Sunucu</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{status.host}:{status.port}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Gönderen</p>
                <p className="mt-0.5 truncate text-foreground">{status.fromName ? `${status.fromName} · ` : ""}{status.fromEmail}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Güvenlik</p>
                <p className="mt-0.5 truncate text-foreground">{ENCRYPTION_OPTIONS.find((o) => o.value === status.encryption)?.label}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Kimlik Doğrulaması</p>
                <p className="mt-0.5 truncate text-foreground">{status.username ? `Var (${status.username})` : "Yok"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Bağlantı tarihi: {formatDate(status.connectedAt ?? null)}</p>

            <div className="flex flex-col gap-2 rounded-xl border border-border/60 p-3.5 sm:flex-row sm:items-end sm:gap-3">
              <div className="flex-1">
                <Label className="mb-1.5">Test E-postası Alıcısı</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  className="h-11 rounded-xl px-3.5"
                />
              </div>
              <Button variant="outline" loading={testing} onClick={handleSendTestMail} className="w-fit">
                <Send className="size-4" />
                Test Maili Gönder
              </Button>
            </div>

            <Button variant="outline" onClick={handleDisconnect} className="w-fit">
              <Unlink className="size-4" />
              Bağlantıyı Kes
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5">SMTP Sunucu</Label>
                <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
              </div>
              <div>
                <Label className="mb-1.5">Port</Label>
                <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3.5">
              <div>
                <Label className="mb-0.5">Kimlik Doğrulaması</Label>
                <p className="text-xs text-muted-foreground">Sunucu kullanıcı adı/şifre gerektiriyorsa açık bırakın.</p>
              </div>
              <Switch checked={requiresAuth} onCheckedChange={setRequiresAuth} />
            </div>
            {requiresAuth && (
              <>
                <div>
                  <Label className="mb-1.5">Kullanıcı Adı</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ornek@firma.com" className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Şifre</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="h-11 rounded-xl px-3.5" />
                </div>
              </>
            )}
            <div>
              <Label className="mb-1.5">Şifreleme</Label>
              <Select value={encryption} onValueChange={(v) => setEncryption(v as SmtpEncryption)}>
                <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                  <SelectValue>{() => ENCRYPTION_OPTIONS.find((o) => o.value === encryption)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ENCRYPTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5">Gönderen Adı</Label>
                <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="PestShield Haşere Yönetimi" className="h-11 rounded-xl px-3.5" />
              </div>
              <div>
                <Label className="mb-1.5">Gönderen E-posta</Label>
                <Input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="bilgi@firma.com" className="h-11 rounded-xl px-3.5" />
              </div>
            </div>
            <Button onClick={handleSave} loading={saving} className="w-fit">
              <Plug className="size-4" />
              Kaydet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ParasutStatus {
  connected: boolean;
  pendingCompanySelection?: boolean;
  clientId?: string;
  companyName?: string | null;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncCount?: number;
}

function ParasutCard() {
  const [status, setStatus] = useState<ParasutStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/parasut");
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("Paraşüt bağlantı durumu alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  function handleOpenAuthorize() {
    if (!clientId.trim()) {
      toast.error("Önce Client ID girin");
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId.trim(),
      redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
      response_type: "code",
    });
    const url = `https://api.parasut.com/oauth/authorize?${params.toString()}`;
    setAuthorizeUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleConnect() {
    if (!clientId.trim() || !clientSecret.trim() || !authCode.trim()) {
      toast.error("Client ID, Client Secret ve yetkilendirme kodunu girin");
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/parasut/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim(), authCode: authCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Paraşüt'e bağlanılamadı");
        return;
      }
      if (data.connected) {
        toast.success("Paraşüt bağlantısı kuruldu");
        setClientId("");
        setClientSecret("");
        setAuthCode("");
        setAuthorizeUrl(null);
        await loadStatus();
      } else {
        setCompanies(data.companies ?? []);
        toast.success("Yetkilendirme tamamlandı — şimdi bir firma seçin");
        await loadStatus();
      }
    } catch {
      toast.error("Paraşüt'e bağlanılamadı — sunucuya ulaşılamadı");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSelectCompany() {
    const company = companies.find((c) => c.id === selectedCompanyId);
    if (!company) {
      toast.error("Bir firma seçin");
      return;
    }
    setSelecting(true);
    try {
      const res = await fetch("/api/integrations/parasut/select-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, companyName: company.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Firma seçilemedi");
        return;
      }
      toast.success("Paraşüt firma bağlantısı tamamlandı");
      setCompanies([]);
      await loadStatus();
    } catch {
      toast.error("Firma seçilemedi — sunucuya ulaşılamadı");
    } finally {
      setSelecting(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/parasut/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Senkronizasyon başarısız oldu");
        return;
      }
      toast.success(`Senkronizasyon tamamlandı — ${data.created} yeni, ${data.updated} güncellenen müşteri`);
      await loadStatus();
    } catch {
      toast.error("Senkronizasyon başarısız oldu — sunucuya ulaşılamadı");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    try {
      await fetch("/api/integrations/parasut", { method: "DELETE" });
      setCompanies([]);
      setSelectedCompanyId("");
      toast.success("Bağlantı kesildi");
      await loadStatus();
    } catch {
      toast.error("Bağlantı kesilemedi");
    }
  }

  return (
    <Card className={cn(GLASS_CARD, "rounded-2xl")}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Paraşüt</p>
              <p className="text-xs text-muted-foreground">Paraşüt&apos;teki müşteriler otomatik olarak Müşteriler listesine senkronize edilsin.</p>
            </div>
          </div>
          {status.connected ? (
            <Badge variant="outline" className="gap-1 rounded-full border-success/20 bg-success/10 text-success">
              <CheckCircle2 className="size-3" />
              Bağlı
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full border-border bg-muted text-muted-foreground">
              Bağlı Değil
            </Badge>
          )}
        </div>

        {loading ? null : status.connected ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Paraşüt Firması</p>
                <p className="mt-0.5 truncate text-foreground">{status.companyName}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Son Senkronizasyon</p>
                <p className="mt-0.5 truncate text-foreground">
                  {status.lastSyncAt ? formatDate(status.lastSyncAt) : "Henüz yapılmadı"}
                  {typeof status.lastSyncCount === "number" && status.lastSyncCount > 0 ? ` · ${status.lastSyncCount} kayıt` : ""}
                </p>
              </div>
            </div>
            {status.lastSyncStatus && status.lastSyncStatus.startsWith("error") && (
              <p className="text-xs text-destructive">Son senkronizasyon hatası: {status.lastSyncStatus.replace(/^error:\s*/, "")}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" loading={syncing} onClick={handleSyncNow} className="w-fit">
                <RefreshCw className="size-4" />
                Şimdi Senkronize Et
              </Button>
              <Button variant="outline" onClick={handleDisconnect} className="w-fit">
                <Unlink className="size-4" />
                Bağlantıyı Kes
              </Button>
            </div>
          </div>
        ) : status.pendingCompanySelection ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-foreground/80">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="min-w-0">Yetkilendirme tamamlandı. Devam etmek için hangi Paraşüt firmasına bağlanacağınızı seçin.</p>
            </div>
            <div>
              <Label className="mb-1.5">Paraşüt Firması</Label>
              <Select value={selectedCompanyId} onValueChange={(v) => setSelectedCompanyId(v ?? "")}>
                <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                  <SelectValue placeholder="Firma seçiniz">
                    {() => companies.find((c) => c.id === selectedCompanyId)?.name ?? "Firma seçiniz"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSelectCompany} loading={selecting} className="w-fit">
              <Plug className="size-4" />
              Firmayı Seç ve Bağlan
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-foreground/80">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="min-w-0">
                Paraşüt hesabınızda oluşturduğunuz OAuth uygulamasının Client ID/Secret&apos;ını girin, ardından
                &quot;Yetkilendirme Linkini Aç&quot;a tıklayıp Paraşüt&apos;te onaylayın — size gösterilen kodu buraya
                yapıştırıp &quot;Bağlan&quot;a basın.
              </p>
            </div>
            <div>
              <Label className="mb-1.5">Client ID</Label>
              <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Paraşüt Client ID" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
            </div>
            <div>
              <Label className="mb-1.5">Client Secret</Label>
              <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="••••••••••••" className="h-11 rounded-xl px-3.5" />
            </div>
            <Button variant="outline" onClick={handleOpenAuthorize} className="w-fit">
              <ExternalLink className="size-4" />
              Yetkilendirme Linkini Aç
            </Button>
            {authorizeUrl && (
              <div>
                <Label className="mb-1.5">Paraşüt&apos;ten Alınan Kod</Label>
                <Input value={authCode} onChange={(e) => setAuthCode(e.target.value)} placeholder="Yetkilendirme kodunu yapıştırın" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
              </div>
            )}
            <Button onClick={handleConnect} loading={connecting} disabled={!authorizeUrl} className="w-fit">
              <Plug className="size-4" />
              Bağlan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Entegrasyonlar</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Üçüncü parti servislerle bağlantıları buradan yönetin.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GoogleCalendarCard />
        <WhatsAppCard />
        <MailSettingsCard />
        <ParasutCard />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Yakında</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COMING_SOON.map((item) => (
            <Card key={item.title} className={cn(GLASS_CARD, "rounded-2xl opacity-70")}>
              <CardContent className="flex flex-col gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <item.icon className="size-4.5" />
                </div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <Badge variant="outline" className="w-fit rounded-full border-border bg-muted text-[10px] text-muted-foreground">
                  Yakında
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
