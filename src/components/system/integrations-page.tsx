"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, FileSpreadsheet, Info, Mail, Plug, Send, Smartphone, Unlink } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnection,
  saveGoogleCalendarConnection,
  type GoogleCalendarConnection,
} from "@/lib/integrations/google-calendar";
import {
  disconnectWhatsApp,
  getWhatsAppConnection,
  saveWhatsAppConnection,
  type WhatsAppConnection,
} from "@/lib/integrations/whatsapp";
import {
  disconnectSmtpMail,
  getSmtpMailConnection,
  saveSmtpMailConnection,
  type SmtpEncryption,
  type SmtpMailConnection,
} from "@/lib/integrations/smtp-mail";
import { cn } from "@/lib/utils";

const COMING_SOON = [
  { icon: FileSpreadsheet, title: "e-Fatura / e-Arşiv", description: "GİB entegrasyonu ile faturalar otomatik e-Fatura/e-Arşiv olarak kesilsin." },
  { icon: Smartphone, title: "SMS Gateway", description: "Servis hatırlatma ve tahsilat bildirimleri SMS ile gönderilsin (Netgsm, İleti Merkezi vb.)." },
];

function GoogleCalendarCard() {
  const [connection, setConnection] = useState<GoogleCalendarConnection>(() => getGoogleCalendarConnection());
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [connecting, setConnecting] = useState(false);

  function handleConnect() {
    if (!clientId.trim() || !clientSecret.trim() || !calendarId.trim()) {
      toast.error("Tüm alanları doldurun");
      return;
    }
    setConnecting(true);
    const next: GoogleCalendarConnection = {
      connected: true,
      clientId: clientId.trim(),
      calendarId: calendarId.trim(),
      connectedAt: new Date().toISOString(),
    };
    saveGoogleCalendarConnection(next);
    setConnection(next);
    setConnecting(false);
    toast.success("Google Calendar bağlantısı kaydedildi");
  }

  function handleDisconnect() {
    disconnectGoogleCalendar();
    setConnection(getGoogleCalendarConnection());
    setClientId("");
    setClientSecret("");
    setCalendarId("");
    toast.success("Bağlantı kesildi");
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
          {connection.connected ? (
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
            Gerçek Google OAuth bağlantısı için Google Cloud Console&apos;da bir proje oluşturup Calendar API&apos;yi
            etkinleştirmeniz ve OAuth Client ID/Secret üretmeniz gerekir. Aşağıdaki bilgileri girip kaydettiğinizde bu ortamda
            bağlantı simüle edilir; İş Emirleri modülündeki servisler bu takvime yazılmaya hazır hale gelir.
          </p>
        </div>

        {connection.connected ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Client ID</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{connection.clientId}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Takvim ID</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{connection.calendarId}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Bağlantı tarihi: {formatDate(connection.connectedAt)}</p>
            <Button variant="outline" onClick={handleDisconnect} className="w-fit">
              <Unlink className="size-4" />
              Bağlantıyı Kes
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div>
              <Label className="mb-1.5">Google OAuth Client ID</Label>
              <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="xxxxxxxx.apps.googleusercontent.com" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
            </div>
            <div>
              <Label className="mb-1.5">Google OAuth Client Secret</Label>
              <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="••••••••••••" className="h-11 rounded-xl px-3.5" />
            </div>
            <div>
              <Label className="mb-1.5">Takvim ID</Label>
              <Input value={calendarId} onChange={(e) => setCalendarId(e.target.value)} placeholder="ornek@group.calendar.google.com" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
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

function WhatsAppCard() {
  const [connection, setConnection] = useState<WhatsAppConnection>(() => getWhatsAppConnection());
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [connecting, setConnecting] = useState(false);

  function handleConnect() {
    if (!phoneNumberId.trim() || !accessToken.trim() || !businessPhone.trim()) {
      toast.error("Tüm alanları doldurun");
      return;
    }
    setConnecting(true);
    const next: WhatsAppConnection = {
      connected: true,
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
      businessPhone: businessPhone.trim(),
      connectedAt: new Date().toISOString(),
    };
    saveWhatsAppConnection(next);
    setConnection(next);
    setConnecting(false);
    toast.success("WhatsApp Business bağlantısı kaydedildi");
  }

  function handleDisconnect() {
    disconnectWhatsApp();
    setConnection(getWhatsAppConnection());
    setPhoneNumberId("");
    setAccessToken("");
    setBusinessPhone("");
    toast.success("Bağlantı kesildi");
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
              <p className="text-xs text-muted-foreground">İş emri bildirimleri ve tahsilat hatırlatmaları WhatsApp ile gönderilsin.</p>
            </div>
          </div>
          {connection.connected ? (
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
            Meta&apos;nın WhatsApp Cloud API&apos;si ile <span className="font-medium">otomatik</span> (onaysız) mesaj göndermek
            için sunucu tarafında saklanan kalıcı bir Access Token gerekir — bu token tarayıcıda güvenli şekilde tutulamaz.
            Bu yüzden İş Emirleri, Ödeme Takibi ve Cari Hesap sayfalarındaki <span className="font-medium">&quot;WhatsApp&quot;</span>{" "}
            butonları, mesaj metni hazır şekilde WhatsApp&apos;ı açan güvenli <span className="font-medium">wa.me</span> bağlantısını
            kullanır; gönderimi siz WhatsApp üzerinden son adımda onaylarsınız. Aşağıya gerçek Meta kimlik bilgilerinizi
            girmeniz, ileride bir backend eklendiğinde tam otomatik gönderime geçişi hazırlar.
          </p>
        </div>

        {connection.connected ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Phone Number ID</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{connection.phoneNumberId}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">İşletme Numarası</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{connection.businessPhone}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Bağlantı tarihi: {formatDate(connection.connectedAt)}</p>
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
              <Label className="mb-1.5">İşletme WhatsApp Numarası</Label>
              <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="0532 000 00 00" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
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

function MailSettingsCard() {
  const [connection, setConnection] = useState<SmtpMailConnection>(() => getSmtpMailConnection());
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<SmtpEncryption>("tls");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  function handleSave() {
    if (!host.trim() || !port.trim() || !username.trim() || !password.trim() || !fromEmail.trim()) {
      toast.error("Tüm zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    const next: SmtpMailConnection = {
      connected: true,
      host: host.trim(),
      port: port.trim(),
      username: username.trim(),
      password,
      encryption,
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim(),
      connectedAt: new Date().toISOString(),
    };
    saveSmtpMailConnection(next);
    setConnection(next);
    setSaving(false);
    toast.success("Mail ayarları kaydedildi");
  }

  function handleDisconnect() {
    disconnectSmtpMail();
    setConnection(getSmtpMailConnection());
    setHost("");
    setPort("587");
    setUsername("");
    setPassword("");
    setEncryption("tls");
    setFromName("");
    setFromEmail("");
    setTestEmail("");
    toast.success("Bağlantı kesildi");
  }

  async function handleSendTestMail() {
    if (!testEmail.trim()) {
      toast.error("Test e-postası göndermek için bir alıcı adresi girin");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/integrations/test-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: connection.host,
          port: connection.port,
          username: connection.username,
          password: connection.password,
          encryption: connection.encryption,
          fromName: connection.fromName,
          fromEmail: connection.fromEmail,
          toEmail: testEmail.trim(),
        }),
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
          {connection.connected ? (
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

        {connection.connected ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">SMTP Sunucu</p>
                <p className="mt-0.5 truncate font-mono text-foreground">{connection.host}:{connection.port}</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground uppercase">Gönderen</p>
                <p className="mt-0.5 truncate text-foreground">{connection.fromName ? `${connection.fromName} · ` : ""}{connection.fromEmail}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Bağlantı tarihi: {formatDate(connection.connectedAt)}</p>

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
            <div>
              <Label className="mb-1.5">Kullanıcı Adı</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ornek@firma.com" className="h-11 rounded-xl px-3.5" />
            </div>
            <div>
              <Label className="mb-1.5">Şifre</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="h-11 rounded-xl px-3.5" />
            </div>
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
