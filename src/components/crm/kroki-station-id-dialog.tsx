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
  onSave: (stations: KrokiStation[]) => void;
}

export function KrokiStationIdDialog({ open, onOpenChange, sketch, onSave }: KrokiStationIdDialogProps) {
  const [stations, setStations] = useState<KrokiStation[]>([]);

  useEffect(() => {
    if (open && sketch) {
      setStations(sketch.stations);
    }
  }, [open, sketch]);

  const numbering = numberStations(stations);

  function handleIdChange(stationId: string, value: string) {
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, stationId: value } : s)));
  }

  function handleSave() {
    onSave(stations);
    toast.success("İstasyon ID'leri kaydedildi");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>İstasyonlar</DialogTitle>
        </DialogHeader>

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
                      <TableHead>İstasyon</TableHead>
                      <TableHead>İstasyon ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeStations.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-medium">İstasyon {numbering.get(s.id)}</TableCell>
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
          <Button type="button" onClick={handleSave}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
