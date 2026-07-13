"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileImage, FileText as FileTextIcon, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatDate } from "@/components/crm/crm-format";
import {
  getServiceDocumentsFor,
  addServiceDocument,
  deleteServiceDocument,
  readDocumentFile,
} from "@/lib/service-document-store";
import type { ServiceDocument } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface BelgeTanimlamaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string | null;
  onCountChange: (serviceOrderId: string, count: number) => void;
}

export function BelgeTanimlamaDialog({ open, onOpenChange, serviceOrderId, onCountChange }: BelgeTanimlamaDialogProps) {
  const [tab, setTab] = useState("listele");
  const [documents, setDocuments] = useState<ServiceDocument[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<{ dataUrl: string; fileName: string; fileType: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh(id: string) {
    const docs = getServiceDocumentsFor(id);
    setDocuments(docs);
    onCountChange(id, docs.length);
  }

  useEffect(() => {
    if (open && serviceOrderId) {
      refresh(serviceOrderId);
      setTab("listele");
      setName("");
      setFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceOrderId]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  async function handleFileSelect(selected: File | undefined) {
    if (!selected) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(selected.type)) {
      toast.error("Lütfen JPEG, JPG, PNG veya PDF dosyası seçin");
      return;
    }
    try {
      const dataUrl = await readDocumentFile(selected, 8);
      setFile({ dataUrl, fileName: selected.name, fileType: selected.type });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dosya yüklenemedi");
    }
  }

  function handleSave() {
    if (!serviceOrderId) return;
    if (!name.trim()) {
      toast.error("Belge adını girin");
      return;
    }
    if (!file) {
      toast.error("Bir belge seçin");
      return;
    }
    setSaving(true);
    addServiceDocument({
      id: `doc-${Date.now()}`,
      serviceOrderId,
      name: name.trim(),
      fileDataUrl: file.dataUrl,
      fileName: file.fileName,
      fileType: file.fileType,
      createdAt: new Date().toISOString(),
    });
    refresh(serviceOrderId);
    setName("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSaving(false);
    setTab("listele");
    toast.success("Belge kaydedildi");
  }

  function handleDelete(id: string) {
    if (!serviceOrderId) return;
    deleteServiceDocument(id);
    refresh(serviceOrderId);
    toast.success("Belge silindi");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Belge Tanımlama</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
          <TabsList variant="line">
            <TabsTrigger value="listele">LİSTELE</TabsTrigger>
            <TabsTrigger value="ekle">EKLE</TabsTrigger>
          </TabsList>

          <TabsContent value="listele" className="mt-4">
            {documents.length === 0 ? (
              <EmptyState icon={FileTextIcon} title="Henüz belge yok" description="EKLE sekmesinden yeni bir belge yükleyin." />
            ) : (
              <div className="flex flex-col gap-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {doc.fileType === "application/pdf" ? <FileTextIcon className="size-5" /> : <FileImage className="size-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                    </div>
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
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ekle" className="mt-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label className="mb-1.5">Belge Adı</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Belge Adı" className="h-11 rounded-xl px-3.5" />
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
                    handleFileSelect(e.dataTransfer.files?.[0]);
                  }}
                >
                  {file ? (
                    <>
                      {file.fileType === "application/pdf" ? (
                        <FileTextIcon className="size-8 text-primary" />
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
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Vazgeç
                </Button>
                <Button type="button" loading={saving} onClick={handleSave}>
                  Kaydet
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
