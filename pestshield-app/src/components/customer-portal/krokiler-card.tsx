"use client";

import { useEffect, useState } from "react";
import { Flame, MapPinned, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatFileSize } from "@/components/crm/crm-format";
import { KROKI_STATION_TYPES, stationColor } from "@/components/crm/kroki-constants";
import { downloadKroki } from "@/components/crm/kroki-dialog";
import type { KrokiSketch, KrokiStationType } from "@/lib/mock/crm";

export function KrokilerCard() {
  const [loading, setLoading] = useState(true);
  const [sketches, setSketches] = useState<KrokiSketch[]>([]);
  const [viewing, setViewing] = useState<KrokiSketch | null>(null);

  useEffect(() => {
    fetch("/api/portal/krokis")
      .then((res) => (res.ok ? res.json() : { krokiSketches: [] }))
      .then((data: { krokiSketches?: KrokiSketch[] }) => setSketches(data.krokiSketches ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Krokiler</h2>
          {!loading && sketches.length === 0 ? (
            <EmptyState icon={MapPinned} title="Henüz kroki yok" description="İlaçlama firmanız kroki eklediğinde burada görünür." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Kroki</TableHead>
                    {KROKI_STATION_TYPES.map((t) => (
                      <TableHead key={t.value} className="text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <span className="size-2 rounded-sm" style={{ background: t.color }} />
                          {t.label}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead>Boyut</TableHead>
                    <TableHead className="w-16 text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sketches.map((sketch, i) => (
                    <TableRow key={sketch.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium text-primary">{sketch.name}</TableCell>
                      {KROKI_STATION_TYPES.map((t) => (
                        <TableCell key={t.value} className="text-center">
                          {sketch.stations.filter((s) => s.type === t.value).length}
                        </TableCell>
                      ))}
                      <TableCell className="text-muted-foreground">{formatFileSize(sketch.fileSizeKb)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon-sm" variant="ghost" title="Görüntüle" onClick={() => setViewing(sketch)}>
                          <Search className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerKrokiViewerDialog sketch={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </>
  );
}

function CustomerKrokiViewerDialog({ sketch, onOpenChange }: { sketch: KrokiSketch | null; onOpenChange: (open: boolean) => void }) {
  const [layerVisibility, setLayerVisibility] = useState<Record<KrokiStationType, boolean>>(
    sketch?.layerVisibility ?? ({} as Record<KrokiStationType, boolean>),
  );
  const [heatMapEnabled, setHeatMapEnabled] = useState(sketch?.heatMapEnabled ?? false);

  useEffect(() => {
    if (sketch) {
      setLayerVisibility(sketch.layerVisibility);
      setHeatMapEnabled(sketch.heatMapEnabled);
    }
  }, [sketch]);

  return (
    <Dialog open={!!sketch} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{sketch?.name}</DialogTitle>
        </DialogHeader>
        {sketch && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
              {KROKI_STATION_TYPES.map((t) => (
                <label key={t.value} className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="size-2.5 rounded-sm" style={{ background: t.color }} />
                  {t.label}
                  <Switch
                    checked={layerVisibility[t.value]}
                    onCheckedChange={(v) => setLayerVisibility((prev) => ({ ...prev, [t.value]: v }))}
                    size="sm"
                  />
                </label>
              ))}
              <label className="flex items-center gap-1.5 text-xs font-medium">
                <Flame className="size-3.5 text-orange-500" />
                Isı Haritası (30 Gün)
                <Switch checked={heatMapEnabled} onCheckedChange={setHeatMapEnabled} size="sm" />
              </label>
            </div>

            <div className="relative max-h-[420px] overflow-auto rounded-xl border border-border/60 bg-muted/20">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sketch.imageDataUrl} alt={sketch.name} className="block w-full select-none" draggable={false} />
                {heatMapEnabled &&
                  sketch.stations.map((s) => (
                    <div
                      key={`heat-${s.id}`}
                      className="pointer-events-none absolute rounded-full opacity-40 blur-lg"
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: 80,
                        height: 80,
                        transform: "translate(-50%, -50%)",
                        background: `radial-gradient(circle, ${stationColor(s.type)} 0%, transparent 70%)`,
                      }}
                    />
                  ))}
                {sketch.stations
                  .filter((s) => layerVisibility[s.type] !== false)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="absolute flex items-center justify-center rounded-sm text-[9px] font-bold text-white shadow-md"
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: sketch.stationSize,
                        height: sketch.stationSize,
                        background: stationColor(s.type),
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => downloadKroki({ ...sketch, layerVisibility })}>
                Kroki&apos;yi İndir
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Kapat
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
