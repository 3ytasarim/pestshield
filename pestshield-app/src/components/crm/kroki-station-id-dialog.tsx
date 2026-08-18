"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KROKI_STATION_TYPES, numberStations } from "@/components/crm/kroki-constants";
import type { KrokiSketch, KrokiStation } from "@/lib/mock/crm";

interface KrokiStationIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sketch: KrokiSketch | null;
  startOffset?: number;
  onSave: (stations: KrokiStation[]) => void;
}

export function KrokiStationIdDialog({ open, onOpenChange, sketch, startOffset = 0, onSave }: KrokiStationIdDialogProps) {
  const [stations, setStations] = useState<KrokiStation[]>([]);

  useEffect(() => {
    if (open && sketch) {
      setStations(sketch.stations);
    }
  }, [open, sketch]);

  const numbering = numberStations(stations, startOffset);

  function handleIdChange(stationId: string, value: string) {
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, stationId: value } : s)));
  }

  function handleNumberChange(stationId: string, value: string) {
    const parsed = value.trim() === "" ? null : Number(value);
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, number: Number.isFinite(parsed) ? parsed : null } : s)),
    );
  }

  function handleSaveClick() {
    onSave(stations.map((s) => ({ ...s, number: s.number ?? numbering.get(s.id) ?? null })));
    toast.success("İstasyon ID'leri kaydedildi");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>İstasyonlar</DialogTitle>
        </DialogHeader>

        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Buradaki numaralar ve ID&apos;ler yalnızca bu kroki üzerindeki pin etiketleridir. Operasyon &gt; İstasyonlar,
          QR Kontrol ve Personel ekranlarında görünmesi için istasyonun ayrıca <strong>İstasyon Ekle</strong> formuyla
          gerçek istasyon kaydı olarak oluşturulması gerekir.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KROKI_STATION_TYPES.map((t) => {
            const typeStations = stations.filter((s) => s.type === t.value);
            if (typeStations.length === 0) return null;
            return (
              <div key={t.value} className="rounded-xl border border-border/60 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <span className="size-2.5 rounded-sm" style={{ background: t.color }} />
                  {t.label}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">No</TableHead>
                      <TableHead>İstasyon ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeStations.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={s.number ?? numbering.get(s.id) ?? ""}
                            onChange={(e) => handleNumberChange(s.id, e.target.value)}
                            className="h-8 w-16 rounded-lg px-2 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={s.stationId ?? ""}
                            onChange={(e) => handleIdChange(s.id, e.target.value)}
                            placeholder="İstasyon ID"
                            className="h-8 rounded-lg px-2 text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button type="button" onClick={handleSaveClick}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
