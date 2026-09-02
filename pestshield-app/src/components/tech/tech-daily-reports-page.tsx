"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";

interface DailyReportRow {
  id: string;
  reportDate: string;
  description: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function TechDailyReportsPage() {
  const [tab, setTab] = useState("listele");
  const [reports, setReports] = useState<DailyReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/tech/daily-reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reports?: DailyReportRow[] } | null) => setReports(data?.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    if (!stripHtml(description)) {
      toast.error("Açıklama girin");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tech/daily-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportDate, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Rapor kaydedilemedi");
        return;
      }
      setReports((prev) => [data.report, ...prev]);
      setDescription("");
      setReportDate(new Date().toISOString().slice(0, 10));
      setTab("listele");
      toast.success("Günlük rapor kaydedildi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">Günlük Rapor</h1>
        <p className="text-xs text-muted-foreground">Kendi günlük notlarınızı ekleyin ve geçmişi görüntüleyin.</p>
      </div>

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
            <EmptyState icon={FileClock} title="Henüz günlük rapor yok" description="EKLE sekmesinden yeni bir rapor girin." />
          ) : (
            <div className="flex flex-col gap-2">
              {reports.map((r) => (
                <Card key={r.id} className={GLASS_CARD}>
                  <CardContent className="flex flex-col gap-1 py-3">
                    <p className="text-sm font-medium text-foreground">{formatDate(r.reportDate)}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{stripHtml(r.description)}</p>
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
              <Button loading={saving} onClick={() => void handleSave()}>
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
