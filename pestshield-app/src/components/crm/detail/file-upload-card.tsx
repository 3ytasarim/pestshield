"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadCardProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  description?: string;
}

export function FileUploadCard({ onFilesSelected, accept, description }: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <UploadCloud className="size-6 text-primary" />
      </div>
      <p className="text-sm font-medium">Dosyaları buraya sürükleyin veya seçmek için tıklayın</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
