"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Eye, FileText, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDate, formatFileSize } from "@/components/crm/crm-format";
import { FileUploadCard } from "@/components/crm/detail/file-upload-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { FILE_CATEGORY_LABELS } from "@/components/crm/crm-labels";
import { getFiles, type FileCategory, type FileItem } from "@/lib/mock/crm";

export function FilesTab({ customerId }: { customerId: string }) {
  const [files, setFiles] = useState<FileItem[]>(() => getFiles(customerId));
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<FileCategory>("other");

  function confirmUpload() {
    const newFiles: FileItem[] = pendingFiles.map((file, i) => ({
      id: `${customerId}-file-${Date.now()}-${i}`,
      customerId,
      name: file.name,
      category,
      uploadedBy: "Siz",
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
    }));
    setFiles((prev) => [...newFiles, ...prev]);
    setPendingFiles([]);
    setUploadOpen(false);
    toast.success(`${newFiles.length} dosya yüklendi`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dosyalar</h2>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="size-4" />
          Dosya Yükle
        </Button>
      </div>

      {files.length === 0 ? (
        <EmptyState icon={FileText} title="Henüz dosya yüklenmemiş" description="Sözleşme, rapor veya sertifika yükleyin." />
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dosya Adı</TableHead>
                <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                <TableHead className="hidden lg:table-cell">Yükleyen</TableHead>
                <TableHead className="hidden lg:table-cell">Yüklenme Tarihi</TableHead>
                <TableHead className="hidden md:table-cell">Boyut</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="rounded-full">
                      {FILE_CATEGORY_LABELS[file.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{file.uploadedBy}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(file.uploadedAt)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatFileSize(file.sizeKb)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Önizleme yakında eklenecek")}>
                          <Eye className="size-3.5" />
                          Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("İndirme yakında eklenecek")}>
                          <Download className="size-3.5" />
                          İndir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        >
                          <Trash2 className="size-3.5" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dosya Yükle</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FileUploadCard
              description="PDF, görsel veya belge dosyaları"
              onFilesSelected={(selected) => setPendingFiles(selected)}
            />
            {pendingFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">{pendingFiles.length} dosya seçildi</p>
            )}
            <div>
              <Label className="mb-1.5">Kategori</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as FileCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FILE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
