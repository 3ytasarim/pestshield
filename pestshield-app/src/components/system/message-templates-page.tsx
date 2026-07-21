"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Info, Mail, Save } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDateTime } from "@/components/crm/crm-format";
import { cn } from "@/lib/utils";

const VARIABLES: { key: string; label: string }[] = [
  { key: "musteriAdi", label: "Müşteri Adı" },
  { key: "isEmriNo", label: "İş Emri No" },
  { key: "servisTuru", label: "Servis Türü" },
  { key: "planlananTarih", label: "Planlanan Tarih" },
  { key: "teknisyenAdi", label: "Teknisyen Adı" },
  { key: "firmaAdi", label: "Firma Adı" },
  { key: "firmaTelefon", label: "Firma Telefon" },
];

type Channel = "email" | "whatsapp";

interface MessageTemplateDTO {
  id: string;
  channel: Channel;
  trigger: "work_order_created";
  isActive: boolean;
  subject: string | null;
  body: string;
  metaTemplateName: string | null;
  metaLanguageCode: string | null;
}

interface MessageSendLogDTO {
  id: string;
  channel: Channel;
  trigger: string;
  recipient: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  sent: "Gönderildi",
  failed: "Başarısız",
  skipped_no_recipient: "Alıcı Yok",
  skipped_not_configured: "Bağlı Değil",
};

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  skipped_no_recipient: "bg-muted text-muted-foreground border-border",
  skipped_not_configured: "bg-muted text-muted-foreground border-border",
};

function ChannelForm({ channel, template, onSaved }: { channel: Channel; template: MessageTemplateDTO | null; onSaved: (t: MessageTemplateDTO) => void }) {
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [metaTemplateName, setMetaTemplateName] = useState(template?.metaTemplateName ?? "");
  const [metaLanguageCode, setMetaLanguageCode] = useState(template?.metaLanguageCode ?? "tr");
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsActive(template?.isActive ?? true);
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
    setMetaTemplateName(template?.metaTemplateName ?? "");
    setMetaLanguageCode(template?.metaLanguageCode ?? "tr");
  }, [template]);

  function insertVariable(key: string) {
    const textarea = bodyRef.current;
    const token = `{{${key}}}`;
    if (!textarea) {
      setBody((prev) => prev + token);
      return;
    }
    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
    });
  }

  async function handleSave() {
    if (!body.trim()) {
      toast.error("Mesaj içeriği zorunludur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/system/message-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          trigger: "work_order_created",
          isActive,
          subject: channel === "email" ? subject : undefined,
          body,
          metaTemplateName: channel === "whatsapp" ? metaTemplateName : undefined,
          metaLanguageCode: channel === "whatsapp" ? metaLanguageCode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Şablon kaydedilemedi");
        return;
      }
      onSaved(data.template);
      toast.success("Şablon kaydedildi");
    } catch {
      toast.error("Şablon kaydedilemedi — sunucuya ulaşılamadı");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={cn(GLASS_CARD, "rounded-2xl")}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-border/60 p-3.5">
          <div>
            <Label className="mb-0.5">Otomatik Gönderim Aktif</Label>
            <p className="text-xs text-muted-foreground">Kapalıysa iş emri oluşunca bu kanaldan mesaj gönderilmez.</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {channel === "whatsapp" && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-foreground/80">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="min-w-0">
              Aşağıdaki metin bir <span className="font-medium">önizleme/referanstır</span>. Meta yalnızca önceden onaylı
              şablon mesajları gönderir — gerçek gönderim için bu metnin Meta Business Manager&apos;da{" "}
              <span className="font-medium">Meta Template Adı</span> alanına girdiğiniz adla, aynı değişken sayısı/sırasıyla
              onaylı bir şablon olarak da tanımlı olması gerekir.
            </p>
          </div>
        )}

        {channel === "email" && (
          <div>
            <Label className="mb-1.5">Konu</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Servisiniz Planlandı — {{isEmriNo}}" className="h-11 rounded-xl px-3.5" />
          </div>
        )}

        {channel === "whatsapp" && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">Meta Template Adı</Label>
              <Input value={metaTemplateName} onChange={(e) => setMetaTemplateName(e.target.value)} placeholder="is_emri_bildirimi" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
            </div>
            <div>
              <Label className="mb-1.5">Dil Kodu</Label>
              <Input value={metaLanguageCode} onChange={(e) => setMetaLanguageCode(e.target.value)} placeholder="tr" className="h-11 rounded-xl px-3.5 font-mono text-sm" />
            </div>
          </div>
        )}

        <div>
          <Label className="mb-1.5">Mesaj İçeriği</Label>
          <Textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Sayın {{musteriAdi}}, {{servisTuru}} hizmetiniz {{planlananTarih}} tarihinde planlanmıştır." className="min-h-[160px] rounded-xl" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Değişkenler (tıklayınca eklenir)</Label>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-foreground/80 transition-colors hover:bg-muted"
              >
                {`{{${v.key}}}`} <span className="font-sans text-muted-foreground">· {v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-fit">
          <Save className="size-4" />
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}

export function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplateDTO[] | null>(null);
  const [recentLogs, setRecentLogs] = useState<MessageSendLogDTO[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/system/message-templates");
      const data = await res.json();
      setTemplates(data.templates ?? []);
      setRecentLogs(data.recentLogs ?? []);
    } catch {
      toast.error("Şablonlar yüklenemedi");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const emailTemplate = templates?.find((t) => t.channel === "email" && t.trigger === "work_order_created") ?? null;
  const whatsappTemplate = templates?.find((t) => t.channel === "whatsapp" && t.trigger === "work_order_created") ?? null;

  function handleSaved(saved: MessageTemplateDTO) {
    setTemplates((prev) => {
      const rest = (prev ?? []).filter((t) => !(t.channel === saved.channel && t.trigger === saved.trigger));
      return [...rest, saved];
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Mail ve WhatsApp İçerik Şablonları</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          İş emri oluşturduğunuzda ilgili müşteriye otomatik olarak gidecek e-posta ve WhatsApp mesajlarının içeriğini buradan
          düzenleyin.
        </p>
      </motion.div>

      {templates === null ? null : (
        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">
              <Mail className="size-3.5" />
              E-posta
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <WhatsAppIcon className="size-3.5" />
              WhatsApp
            </TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <ChannelForm channel="email" template={emailTemplate} onSaved={handleSaved} />
          </TabsContent>
          <TabsContent value="whatsapp">
            <ChannelForm channel="whatsapp" template={whatsappTemplate} onSaved={handleSaved} />
          </TabsContent>
        </Tabs>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Son Gönderim Denemeleri</h2>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz bir gönderim denemesi yok.</p>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Detay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.channel === "email" ? "E-posta" : "WhatsApp"}</TableCell>
                    <TableCell className="font-mono text-xs">{log.recipient}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("rounded-full font-medium", STATUS_STYLES[log.status])}>
                        {STATUS_LABELS[log.status] ?? log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">{log.errorMessage ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
