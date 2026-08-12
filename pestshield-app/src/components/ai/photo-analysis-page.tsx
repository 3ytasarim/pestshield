"use client";

// "Fotoğrafı Analizi" — /api/ai/photo-analysis üzerinden gerçek bir Claude
// görsel analizi çalıştırır. Uydurulmuş/mock bir sonuç göstermez; API hata
// dönerse hata mesajı olduğu gibi gösterilir.

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, Loader2, ShieldCheck, ShieldQuestion, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { FileUploadCard } from "@/components/crm/detail/file-upload-card";
import { cn } from "@/lib/utils";

interface PhotoAnalysisResult {
  summary: string;
  findings: string[];
  riskLevel: "low" | "medium" | "high" | "unknown";
  riskReason: string;
  recommendations: string[];
  disclaimer: string;
}

const RISK_META: Record<PhotoAnalysisResult["riskLevel"], { label: string; icon: typeof ShieldCheck; className: string }> = {
  low: { label: "Düşük Risk", icon: ShieldCheck, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  medium: { label: "Orta Risk", icon: AlertTriangle, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  high: { label: "Yüksek Risk", icon: AlertTriangle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" },
  unknown: { label: "Belirsiz", icon: ShieldQuestion, className: "bg-muted text-muted-foreground border-border" },
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PhotoAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFilesSelected(files: File[]) {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  }

  function handleClear() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setNote("");
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await fetch("/api/ai/photo-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, note }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message || "Fotoğraf analiz edilemedi.");
        return;
      }
      setResult(body.analysis as PhotoAnalysisResult);
    } catch {
      setError("Fotoğraf analiz edilirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const riskMeta = result ? RISK_META[result.riskLevel] : null;
  const RiskIcon = riskMeta?.icon;

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="flex items-center gap-2 text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
          <Camera className="size-7 text-primary" />
          Fotoğrafı Analizi
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Saha fotoğrafı yükleyin — istasyon, tuzak, zararlı izi veya hasar görselini Claude ile analiz edip risk
          değerlendirmesi ve öneri alın.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardContent className="flex flex-col gap-4">
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Yüklenen fotoğraf" className="max-h-80 w-full object-contain bg-black/5" />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80"
                  onClick={handleClear}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ) : (
              <FileUploadCard accept="image/*" description="JPG, PNG, WEBP (maks. 8 MB)" onFilesSelected={handleFilesSelected} />
            )}

            <div>
              <Label className="mb-1.5">Ek Not (opsiyonel)</Label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Örn: Mutfak alt dolabı, kemirgen izi şüphesi"
              />
            </div>

            <Button onClick={() => void handleAnalyze()} disabled={!file} loading={loading} size="lg">
              <Sparkles className="size-4" />
              Fotoğrafı Analiz Et
            </Button>
          </CardContent>
        </Card>

        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                Fotoğraf analiz ediliyor…
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>
            ) : result ? (
              <div className="flex flex-col gap-4">
                {riskMeta && RiskIcon && (
                  <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", riskMeta.className)}>
                    <RiskIcon className="size-3.5" />
                    {riskMeta.label}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">Özet</p>
                  <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>
                </div>
                {result.findings.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground">Bulgular</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {result.findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">Risk Gerekçesi</p>
                  <p className="mt-1 text-sm text-muted-foreground">{result.riskReason}</p>
                </div>
                {result.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground">Öneriler</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {result.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground italic">{result.disclaimer}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                <Camera className="size-8 opacity-40" />
                Analiz sonucu burada görünecek.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
