"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowUpDown, Eye, FileText, Loader2, Plus, Search, Trash2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { readImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

interface CompanyDocument {
  id: string;
  name: string;
  fileDataUrl: string;
  fileName: string;
  fileSizeKb: number;
  createdAt: string;
}

type SortKey = "name" | "fileSizeKb";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

function isAllowedDocumentFile(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  // Bazı tarayıcılar/işletim sistemleri eski .doc/.xls dosyaları için MIME type döndürmez — uzantıya da bakılır.
  const lowerName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function isPdfDocument(doc: CompanyDocument): boolean {
  return doc.fileName.toLowerCase().endsWith(".pdf");
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(2)} KB`;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<CompanyDocument | null>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<{ dataUrl: string; fileName: string; sizeKb: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(res.ok ? (data.documents ?? []) : []);
    } catch {
      toast.error("Belgeler alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? documents.filter((d) => d.name.toLowerCase().includes(q)) : documents;
    const sorted = [...list].sort((a, b) => {
      const cmp = sortKey === "name" ? a.name.localeCompare(b.name) : a.fileSizeKb - b.fileSizeKb;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [documents, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function handleFileSelect(selected: File | undefined) {
    if (!selected) return;
    if (!isAllowedDocumentFile(selected)) {
      toast.error("Lütfen bir PDF, Word veya Excel dosyası seçin");
      return;
    }
    try {
      const dataUrl = await readImageFile(selected, 10);
      setFile({ dataUrl, fileName: selected.name, sizeKb: selected.size / 1024 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dosya yüklenemedi");
    }
  }

  function resetAddForm() {
    setName("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
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
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), fileDataUrl: file.dataUrl, fileName: file.fileName, fileSizeKb: file.sizeKb }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Belge kaydedilemedi");
        return;
      }
      toast.success("Belge kaydedildi");
      resetAddForm();
      setAddOpen(false);
      await loadDocuments();
    } catch {
      toast.error("Belge kaydedilemedi — sunucuya ulaşılamadı");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message ?? "Belge silinemedi");
        return;
      }
      toast.success("Belge silindi");
      await loadDocuments();
    } catch {
      toast.error("Belge silinemedi — sunucuya ulaşılamadı");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Belgeler</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Ruhsat, sigorta poliçesi, sözleşme şablonu gibi şirket belgelerinizi buradan yönetin.
          </p>
        </div>
        <RainbowButton onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Yeni Belge Ekle
        </RainbowButton>
      </motion.div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 w-20 rounded-lg px-3">
                  <SelectValue>{() => String(pageSize)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              kayıt göster
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="İçerik ara…"
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </div>

          {loading ? null : filtered.length === 0 ? (
            <EmptyState icon={FileText} title="Henüz belge yok" description="'Yeni Belge Ekle' butonuyla ilk belgenizi yükleyin." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                        Belge Türü
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("fileSizeKb")}>
                        Boyut
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((doc, i) => (
                    <TableRow key={doc.id} className="cursor-pointer" onClick={() => setViewDoc(doc)}>
                      <TableCell className="text-muted-foreground">{(currentPage - 1) * pageSize + i + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{doc.name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatSize(doc.fileSizeKb)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon-sm" variant="outline" onClick={() => setViewDoc(doc)} aria-label="Belgeyi görüntüle">
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(doc.id)}
                            aria-label="Belgeyi sil"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                  {filtered.length} kayıttan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)}{" "}
                  arası gösteriliyor
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                    Önceki
                  </Button>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Sonraki
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Belge Ekle</DialogTitle>
            <DialogDescription>Ruhsat, sigorta poliçesi, sözleşme şablonu gibi bir belge yükleyin.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <Label className="mb-1.5">Belge Adı</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Mali Sorumluluk Sigorta Poliçesi" className="h-11 rounded-xl px-3.5" />
            </div>

            <div>
              <Label className="mb-1.5">Belge * (PDF, Word, Excel)</Label>
              <div
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors",
                  dragOver && "border-primary bg-primary/5",
                  file && "border-solid border-primary/20 bg-muted/30",
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
              >
                {file ? (
                  <>
                    <FileText className="size-8 text-primary" />
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Vazgeç
            </Button>
            <RainbowButton type="button" disabled={saving} onClick={handleSave}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Kaydet
            </RainbowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewDoc?.name}</DialogTitle>
            <DialogDescription>{viewDoc?.fileName}</DialogDescription>
          </DialogHeader>
          {viewDoc &&
            (isPdfDocument(viewDoc) ? (
              <iframe src={viewDoc.fileDataUrl} className="h-[70vh] w-full rounded-lg border border-border" title={viewDoc.name} />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
                <FileText className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Bu dosya türü için tarayıcı içi önizleme desteklenmiyor.</p>
                <Button onClick={() => window.open(viewDoc.fileDataUrl, "_blank", "noopener,noreferrer")}>
                  <Eye className="size-4" />
                  Yeni Sekmede Aç
                </Button>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
