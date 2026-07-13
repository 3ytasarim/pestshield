"use client";

import { Camera, MapPin, MoreVertical, Sparkles, Trash2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { PHOTO_CATEGORY_LABELS } from "@/components/crm/crm-labels";
import { cn } from "@/lib/utils";
import type { Photo } from "@/lib/mock/crm";

interface PhotoGalleryProps {
  photos: Photo[];
  onAnalyze: (photo: Photo) => void;
  onDelete: (photo: Photo) => void;
}

export function PhotoGallery({ photos, onAnalyze, onDelete }: PhotoGalleryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo) => (
        <Card key={photo.id} className={cn(GLASS_CARD, "overflow-hidden p-0")}>
          <div
            className="flex h-36 items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${photo.colorFrom}, ${photo.colorTo})` }}
          >
            <Camera className="size-8 text-white/70" />
          </div>
          <CardContent className="flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="secondary" className="rounded-full">
                {PHOTO_CATEGORY_LABELS[photo.category]}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAnalyze(photo)}>
                    <Sparkles className="size-3.5" />
                    AI Analiz Et
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(photo)}>
                    <Trash2 className="size-3.5" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm font-medium leading-tight">{photo.description}</p>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {photo.location}
              </span>
              <span className="flex items-center gap-1">
                <User className="size-3" />
                {photo.uploadedBy} · {formatDate(photo.date)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
