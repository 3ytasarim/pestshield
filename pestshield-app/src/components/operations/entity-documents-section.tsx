"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

interface EntityDocument {
  id: string;
  name: string;
  fileDataUrl: string;
  fileName: string;
  fileSizeKb: number;
  createdAt: string;
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(2)} KB`;
}

export function EntityDocumentsSection({ apiBase }: { apiBase: string }) {
  const [documents, setDocuments] = useState<EntityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [file, setFile] = useState<{ dataUrl: string; fileName: string; sizeKb: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      const data = await res.json();
      setDocuments(res.ok ? (data.documents ?? []) : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  async function handleFileSelect(selected: File | undefined) {
    if (!selected) return;
    try {
      const dataUrl = await readImageFile(selected, 10);
      setFile({ dataUrl, fileName: selected.name, sizeKb: Math.round(selected.size / 1024) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dosya yüklenemedi");
    }
  }

  async function handleAdd() {
    if (!name.trim()) {
      toast.error("Belge adını girin");
      return;
    }
    if (!file) {
      toast.error("Bir belge dosyası seçin");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), fileDataUrl: file.dataUrl, fileName: file.fileName, fileSizeKb: file.sizeKb }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Belge kaydedilemedi");
        return;
      }
      toast.success("Belge eklendi");
      setName("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.message ?? "Belge silinemedi");
      return;
    }
    toast.success("Belge silindi");
    await loadDocuments();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <span className="text-sm font-semibold text-foreground">Belgeler</span>
      </div>
      <div className="flex flex-col gap-3.5 p-4">
        {!loading && documents.length > 0 && (
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(doc.fileSizeKb)}</p>
                </div>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div>
          <Label className="mb-1.5">Belge Adı</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Sağlık Raporu, SRC Belgesi" className="h-11 rounded-xl px-3.5" />
        </div>
        <div>
          <Label className="mb-1.5">Belge * (PDF, Word, Görsel)</Label>
          <div
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center transition-colors",
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
              handleFileSelect(e.dataTransfer.files?.[0]);
            }}
          >
            {file ? <p className="text-xs font-medium text-foreground">{file.fileName}</p> : <Upload className="size-5 text-muted-foreground" />}
            <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
              {file ? "Değiştir" : "Dosya Seç"}
            </Button>
            <p className="text-xs text-muted-foreground">Sürükle &amp; Bırak</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,image/jpeg,image/png,application/pdf"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="self-start" disabled={saving} onClick={handleAdd}>
          <Upload className="size-3.5" />
          Belge Ekle
        </Button>
      </div>
    </div>
  );
}
