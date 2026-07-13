"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadCard } from "@/components/crm/detail/file-upload-card";
import { PhotoGallery } from "@/components/crm/detail/photo-gallery";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { PHOTO_CATEGORY_LABELS } from "@/components/crm/crm-labels";
import { getPhotos, MOCK_AI_PHOTO_ANALYSIS, type Photo, type PhotoCategory } from "@/lib/mock/crm";

const PALETTE: [string, string][] = [
  ["#0877b2", "#0a3d75"],
  ["#7c3aed", "#4c1d95"],
  ["#d97706", "#92400e"],
  ["#0891b2", "#155e75"],
];

export function PhotosTab({ customerId }: { customerId: string }) {
  const [photos, setPhotos] = useState<Photo[]>(() => getPhotos(customerId));
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<PhotoCategory>("general");
  const [description, setDescription] = useState("");
  const [deleting, setDeleting] = useState<Photo | null>(null);
  const [analyzing, setAnalyzing] = useState<Photo | null>(null);
  const [analyzeState, setAnalyzeState] = useState<"loading" | "done">("loading");

  function confirmUpload() {
    const newPhotos: Photo[] = pendingFiles.map((file, i) => ({
      id: `${customerId}-photo-${Date.now()}-${i}`,
      customerId,
      category,
      description: description || file.name,
      date: new Date().toISOString().slice(0, 10),
      location: "Genel Alan",
      uploadedBy: "Siz",
      colorFrom: PALETTE[i % PALETTE.length][0],
      colorTo: PALETTE[i % PALETTE.length][1],
    }));
    setPhotos((prev) => [...newPhotos, ...prev]);
    setPendingFiles([]);
    setDescription("");
    setUploadOpen(false);
    toast.success(`${newPhotos.length} fotoğraf yüklendi`);
  }

  function analyze(photo: Photo) {
    setAnalyzing(photo);
    setAnalyzeState("loading");
    setTimeout(() => setAnalyzeState("done"), 1200);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fotoğraflar</h2>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="size-4" />
          Fotoğraf Yükle
        </Button>
      </div>

      {photos.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Henüz fotoğraf yüklenmemiş" description="Saha fotoğraflarını buradan yükleyin." />
      ) : (
        <PhotoGallery photos={photos} onAnalyze={analyze} onDelete={setDeleting} />
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Fotoğraf Yükle</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FileUploadCard description="JPG, PNG" accept="image/*" onFilesSelected={setPendingFiles} />
            {pendingFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">{pendingFiles.length} fotoğraf seçildi</p>
            )}
            <div>
              <Label className="mb-1.5">Kategori</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PhotoCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PHOTO_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Açıklama</Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fotoğraf açıklaması"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={confirmUpload} disabled={pendingFiles.length === 0}>
              Yükle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!analyzing} onOpenChange={(open) => !open && setAnalyzing(null)}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              AI Fotoğraf Analizi
            </DialogTitle>
          </DialogHeader>
          {analyzeState === "loading" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              Fotoğraf analiz ediliyor…
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              {MOCK_AI_PHOTO_ANALYSIS}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setAnalyzing(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fotoğrafı sil</AlertDialogTitle>
            <AlertDialogDescription>Bu fotoğraf kalıcı olarak silinecek.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setPhotos((prev) => prev.filter((p) => p.id !== deleting?.id));
                setDeleting(null);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
