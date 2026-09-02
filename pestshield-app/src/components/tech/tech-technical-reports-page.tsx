"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileImage, FileText, Mail, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxItem } from "@/components/ui/combobox";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import { readImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

interface CustomerOption {
  id: string;
  companyName: string;
}

interface TechnicalReportRow {
  id: string;
  reportDate: string;
  description: string;
  documentName: string;
  fileDataUrl: string;
  fileName: string;
  fileType: string;
  emailSentAt: string | null;
}

export function TechTechnicalReportsPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const customerItems = useMemo(() => customers.map((c) => ({ value: c.id, label: c.companyName })), [customers]);

  const [tab, setTab] = useState("listele");
  const [reports, setReports] = useState<TechnicalReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [file, setFile] = useState<{ dataUrl: string; fileName: string; fileType: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/crm/customers/assigned")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customers?: CustomerOption[] } | null) => setCustomers(data?.customers ?? []))
      .catch(() => setCustomers([]));
  }, []);

  function loadReports(id: string) {
    setLoading(true);
    fetch(`/api/tech/technical-reports?customerId=${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reports?: TechnicalReportRow[] } | null) => setReports(data?.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (customerId) loadReports(customerId);
    else setReports([]);
  }, [customerId]);

  async function handleFileSelect(selected: File | undefined) {
    if (!selected) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(selected.type)) {
      toast.error("Lütfen JPEG, JPG, PNG veya PDF dosyası seçin");
      return;
    }
    try {
      const dataUrl = await readImageFile(selected, 8);
      setFile({ dataUrl, fileName: selected.name, fileType: selected.type });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dosya yüklenemedi");
    }
  }

  async function handleSave() {
    if (!customerId) return;
    if (!documentName.trim()) {
      toast.error("Belge adını girin");
      return;
    }
    if (!file) {
      toast.error("Bir belge seçin");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tech/technical-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          reportDate,
          description,
          documentName: documentName.trim(),
          fileDataUrl: file.dataUrl,
          fileName: file.fileName,
          fileType: file.fileType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Rapor kaydedilemedi");
        return;
      }
      setReports((prev) => [data.report, ...prev]);
      setDescription("");
      setDocumentName("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setReportDate(new Date().toISOString().slice(0, 10));
      setTab("listele");
      toast.success("Teknik rapor kaydedildi");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendEmail(report: TechnicalReportRow) {
    setSendingId(report.id);
    try {
      const res = await fetch(`/api/tech/technical-reports/${report.id}/send-email`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Mail gönderilemedi");
        return;
      }
      setReports((prev) => prev.map((r) => (r.id === report.id ? data.report : r)));
      toast.success("Rapor müşteriye e-posta ile gönderildi");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Teknik Rapor</h1>
        <p className="text-xs text-muted-foreground">Müşteriye özel belgeli rapor oluşturun ve isterseniz e-posta ile gönderin.</p>
      </div>

      <Combobox
        items={customerItems}
        value={customerItems.find((c) => c.value === customerId) ?? null}
        onValueChange={(selected) => setCustomerId(selected?.value ?? null)}
      >
        <ComboboxInput placeholder="Müşteri Seçiniz…" className="h-11 rounded-xl px-3.5 pl-8" />
        <ComboboxContent>
          {(option: { value: string; label: string }) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>

      {!customerId ? (
        <EmptyState icon={FileText} title="Önce müşteri seçin" description="Rapor listelemek veya eklemek için yukarıdan bir müşteri seçin." />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(String(v ?? "listele"))}>
          <TabsList variant="line">
            <TabsTrigger value="listele">LİSTELE</TabsTrigger>
            <TabsTrigger value="ekle">EKLE</TabsTrigger>
          </TabsList>

          <TabsContent value="listele" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
                Yükleniyor…
              </div>
            ) : reports.length === 0 ? (
              <EmptyState icon={FileText} title="Henüz teknik rapor yok" description="EKLE sekmesinden yeni bir rapor girin." />
            ) : (
              <div className="flex flex-col gap-2">
                {reports.map((r) => (
                  <Card key={r.id} className={GLASS_CARD}>
                    <CardContent className="flex items-center gap-3 py-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {r.fileType === "application/pdf" ? <FileText className="size-4" /> : <FileImage className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{r.documentName}</p>
                        <p className="truncate text-xs text-muted-foreground">{formatDate(r.reportDate)}</p>
                      </div>
                      {r.emailSentAt ? (
                        <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Gönderildi</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={sendingId === r.id}
                          onClick={() => void handleSendEmail(r)}
                        >
                          <Mail className="size-3.5" />
                          Email Gönder
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ekle" className="mt-4">
            <Card className={GLASS_CARD}>
              <CardContent className="flex flex-col gap-4 py-4">
                <div>
                  <Label className="mb-1.5">Rapor Tarihi</Label>
                  <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Açıklama</Label>
                  <RichTextEditor value={description} onChange={setDescription} placeholder="Bir şeyler yaz" />
                </div>
                <div>
                  <Label className="mb-1.5">Belge Adı</Label>
                  <Input value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="Belge Adı" className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Belge * (*.JPEG, *.JPG, *.PNG, *.PDF)</Label>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors",
                      dragOver && "border-primary bg-primary/5",
                      file && "border-solid border-primary/20 bg-muted/30",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      void handleFileSelect(e.dataTransfer.files?.[0]);
                    }}
                  >
                    {file ? (
                      <>
                        {file.fileType === "application/pdf" ? (
                          <FileText className="size-8 text-primary" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={file.dataUrl} alt="" className="h-20 rounded-lg object-contain" />
                        )}
                        <p className="text-xs font-medium text-foreground">{file.fileName}</p>
                      </>
                    ) : (
                      <Upload className="size-6 text-muted-foreground" />
                    )}
                    <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                      {file ? "Değiştir" : "Dosya Seç"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Sürükle &amp; Bırak</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => void handleFileSelect(e.target.files?.[0])}
                    />
                  </div>
                </div>
                <Button loading={saving} onClick={() => void handleSave()}>
                  Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
