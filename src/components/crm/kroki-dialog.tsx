"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileBarChart,
  Flag,
  Flame,
  MapPinned,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
import { KROKI_STATION_TYPES, numberStations, stationColor } from "@/components/crm/kroki-constants";
import { KrokiStationIdDialog } from "@/components/crm/kroki-station-id-dialog";
import {
  getKrokiSketchesFor,
  addKrokiSketch,
  updateKrokiSketch,
  deleteKrokiSketch,
  readKrokiFile,
  DEFAULT_LAYER_VISIBILITY,
} from "@/lib/kroki-store";
import { compositeKrokiImage } from "@/lib/kroki-image";
import { buildStationReportRows } from "@/lib/kat-plani-report-data";
import { printKatPlaniIstasyonRaporu } from "@/lib/pdf/kat-plani-report";
import { getCustomerById, type KrokiSketch, type KrokiStation, type KrokiStationType } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface KrokiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string | null;
  onCountChange: (serviceOrderId: string, count: number) => void;
  customerId?: string | null;
  serviceName?: string;
}

export function KrokiDialog({ open, onOpenChange, serviceOrderId, onCountChange, customerId, serviceName }: KrokiDialogProps) {
  const [tab, setTab] = useState<string>("listele");
  const [sketches, setSketches] = useState<KrokiSketch[]>([]);
  const [editingSketch, setEditingSketch] = useState<KrokiSketch | null>(null);
  const [stationIdSketch, setStationIdSketch] = useState<KrokiSketch | null>(null);
  const [printingReportId, setPrintingReportId] = useState<string | null>(null);

  const [addName, setAddName] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addFile, setAddFile] = useState<{ dataUrl: string; sizeKb: number } | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  function refresh(id: string) {
    const list = getKrokiSketchesFor(id);
    setSketches(list);
    onCountChange(id, list.length);
  }

  useEffect(() => {
    if (open && serviceOrderId) {
      refresh(serviceOrderId);
      setTab("listele");
      setEditingSketch(null);
      setAddName("");
      setAddDate(new Date().toLocaleDateString("tr-TR"));
      setAddFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceOrderId]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  async function handleAddFileSelect(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Lütfen JPG veya PNG dosyası seçin");
      return;
    }
    try {
      const dataUrl = await readKrokiFile(file, 8);
      setAddFile({ dataUrl, sizeKb: Math.round(file.size / 1024) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Görsel yüklenemedi");
    }
  }

  function handleAddSave() {
    if (!serviceOrderId) return;
    if (!addName.trim()) {
      toast.error("Kroki adını girin");
      return;
    }
    if (!addFile) {
      toast.error("Bir kroki görseli seçin");
      return;
    }
    setAddSaving(true);
    addKrokiSketch({
      id: `kroki-${Date.now()}`,
      serviceOrderId,
      name: addName.trim(),
      createdDate: addDate,
      imageDataUrl: addFile.dataUrl,
      fileSizeKb: addFile.sizeKb,
      stations: [],
      stationSize: 24,
      heatMapEnabled: false,
      layerVisibility: DEFAULT_LAYER_VISIBILITY,
      createdAt: new Date().toISOString(),
    });
    refresh(serviceOrderId);
    setAddName("");
    setAddFile(null);
    if (addFileInputRef.current) addFileInputRef.current.value = "";
    setAddSaving(false);
    setTab("listele");
    toast.success("Kroki kaydedildi");
  }

  function handleDeleteSketch(id: string) {
    if (!serviceOrderId) return;
    deleteKrokiSketch(id);
    refresh(serviceOrderId);
    toast.success("Kroki silindi");
  }

  function openEditor(sketch: KrokiSketch) {
    setEditingSketch(sketch);
    setTab("duzenle");
  }

  async function handlePrintKatPlani(sketch: KrokiSketch) {
    if (!serviceOrderId) return;
    const customer = customerId ? getCustomerById(customerId) : null;
    if (!customer) {
      toast.error("Müşteri bilgisi bulunamadı");
      return;
    }
    setPrintingReportId(sketch.id);
    try {
      const compositeImage = await compositeKrokiImage(sketch);
      const rows = buildStationReportRows(serviceOrderId, sketch);
      await printKatPlaniIstasyonRaporu(sketch, rows, compositeImage, customer, serviceName ?? "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rapor oluşturulamadı");
    } finally {
      setPrintingReportId(null);
    }
  }

  function handleEditorSave(updated: KrokiSketch) {
    if (!serviceOrderId) return;
    updateKrokiSketch(updated.id, updated);
    refresh(serviceOrderId);
    setEditingSketch(null);
    setTab("listele");
    toast.success("Kroki güncellendi");
  }

  function handleStationIdSave(stations: KrokiStation[]) {
    if (!serviceOrderId || !stationIdSketch) return;
    updateKrokiSketch(stationIdSketch.id, { stations });
    refresh(serviceOrderId);
    setStationIdSketch(null);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-3xl", tab === "duzenle" && "sm:max-w-4xl")}>
        <DialogHeader>
          <DialogTitle>Kroki Tanımlama</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="min-w-0">
          <TabsList variant="line">
            <TabsTrigger value="listele">LİSTELE</TabsTrigger>
            {editingSketch ? (
              <TabsTrigger value="duzenle">DÜZENLE</TabsTrigger>
            ) : (
              <TabsTrigger value="ekle">EKLE</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="listele" className="mt-4 min-w-0">
            {sketches.length === 0 ? (
              <EmptyState icon={MapPinned} title="Henüz kroki yok" description="EKLE sekmesinden yeni bir kroki yükleyin." />
            ) : (
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">Kroki Listesi</span>
                  <span className="text-xs font-medium text-muted-foreground">{sketches.length} kayıt</span>
                </div>
                <div className="min-w-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Kroki</TableHead>
                        <TableHead>İstasyonlar</TableHead>
                        <TableHead className="text-center">Toplam</TableHead>
                        <TableHead>Boyut</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sketches.map((sketch) => (
                        <TableRow key={sketch.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={sketch.imageDataUrl}
                                alt=""
                                className="size-10 shrink-0 rounded-lg border border-border/60 object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{sketch.name}</p>
                                <p className="text-xs text-muted-foreground">{sketch.createdDate || "—"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1">
                              {KROKI_STATION_TYPES.map((t) => {
                                const count = sketch.stations.filter((s) => s.type === t.value).length;
                                return (
                                  <span
                                    key={t.value}
                                    title={t.label}
                                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                                    style={{ background: `${t.color}1f`, color: t.color }}
                                  >
                                    <span className="size-1.5 rounded-full" style={{ background: t.color }} />
                                    {count}
                                  </span>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                              {sketch.stations.length}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatFileSize(sketch.fileSizeKb)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="İstasyonlar"
                                className={cn("rounded-lg hover:bg-muted", sketch.stations.some((s) => s.stationId) && "text-primary hover:text-primary")}
                                onClick={() => setStationIdSketch(sketch)}
                              >
                                <Flag className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-lg hover:bg-muted"
                                title="Kat Planı İstasyon Raporu"
                                disabled={printingReportId === sketch.id}
                                onClick={() => handlePrintKatPlani(sketch)}
                              >
                                <FileBarChart className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="rounded-lg hover:bg-muted" title="Krokiyi İndir" onClick={() => downloadKroki(sketch)}>
                                <Download className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="rounded-lg hover:bg-muted" title="Düzenle" onClick={() => openEditor(sketch)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title="Sil"
                                onClick={() => handleDeleteSketch(sketch.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {editingSketch ? (
            <TabsContent value="duzenle" className="mt-4">
              <KrokiEditor sketch={editingSketch} onCancel={() => { setEditingSketch(null); setTab("listele"); }} onSave={handleEditorSave} />
            </TabsContent>
          ) : (
            <TabsContent value="ekle" className="mt-4">
              <div className="flex flex-col gap-4">
                <div>
                  <Label className="mb-1.5">Kroki Adı</Label>
                  <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Kroki Adı" className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Kroki Oluşturma Tarihi</Label>
                  <Input value={addDate} onChange={(e) => setAddDate(e.target.value)} placeholder="gg/aa/yyyy" className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Kroki * (*.JPG, *.PNG)</Label>
                  <div className={cn("flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center", addFile && "border-solid border-primary/20 bg-muted/30")}>
                    {addFile ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={addFile.dataUrl} alt="" className="h-24 rounded-lg object-contain" />
                    ) : (
                      <Upload className="size-6 text-muted-foreground" />
                    )}
                    <Button type="button" size="sm" onClick={() => addFileInputRef.current?.click()}>
                      {addFile ? "Değiştir" : "Dosya Seç"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Sürükle &amp; Bırak</p>
                    <input
                      ref={addFileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={(e) => handleAddFileSelect(e.target.files?.[0])}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Vazgeç
                  </Button>
                  <Button type="button" loading={addSaving} onClick={handleAddSave}>
                    Kaydet
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>

    <KrokiStationIdDialog
      open={!!stationIdSketch}
      onOpenChange={(o) => !o && setStationIdSketch(null)}
      sketch={stationIdSketch}
      onSave={handleStationIdSave}
    />
    </>
  );
}

function downloadKroki(sketch: KrokiSketch) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    sketch.stations.forEach((station) => {
      if (sketch.layerVisibility[station.type] === false) return;
      const size = sketch.stationSize;
      ctx.fillStyle = stationColor(station.type);
      ctx.fillRect((station.x / 100) * img.naturalWidth - size / 2, (station.y / 100) * img.naturalHeight - size / 2, size, size);
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sketch.name || "kroki"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };
  img.src = sketch.imageDataUrl;
}

interface KrokiEditorProps {
  sketch: KrokiSketch;
  onCancel: () => void;
  onSave: (updated: KrokiSketch) => void;
}

function KrokiEditor({ sketch, onCancel, onSave }: KrokiEditorProps) {
  const [name, setName] = useState(sketch.name);
  const [date, setDate] = useState(sketch.createdDate);
  const [stations, setStations] = useState<KrokiStation[]>(sketch.stations);
  const [stationSize, setStationSize] = useState(sketch.stationSize);
  const [heatMapEnabled, setHeatMapEnabled] = useState(sketch.heatMapEnabled);
  const [layerVisibility, setLayerVisibility] = useState(sketch.layerVisibility);
  const [placementMode, setPlacementMode] = useState<KrokiStationType | null>(null);
  const [continuous, setContinuous] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  function coordsFromEvent(e: { clientX: number; clientY: number }) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (!placementMode || draggingId) return;
    const coords = coordsFromEvent(e);
    if (!coords) return;
    setStations((prev) => [...prev, { id: `station-${Date.now()}`, type: placementMode, stationId: "", ...coords }]);
    if (!continuous) setPlacementMode(null);
  }

  function handleStationPointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingId(id);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingId) return;
    const coords = coordsFromEvent(e);
    if (!coords) return;
    setStations((prev) => prev.map((s) => (s.id === draggingId ? { ...s, ...coords } : s)));
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  function removeStation(id: string) {
    setStations((prev) => prev.filter((s) => s.id !== id));
  }

  function handleWheel(e: React.WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.5, z + (e.deltaY < 0 ? 0.1 : -0.1))));
  }

  function quickPlace(type: KrokiStationType) {
    setPlacementMode((prev) => (prev === type ? null : type));
  }

  const stationNumbering = numberStations(stations);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <Label className="mb-1.5">Kroki Adı</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl px-3.5" />
        </div>
        <div>
          <Label className="mb-1.5">Kroki Oluşturma Tarihi</Label>
          <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="gg/aa/yyyy" className="h-11 rounded-xl px-3.5" />
        </div>
      </div>

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

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Hızlı yerleştirme:</span>
        {KROKI_STATION_TYPES.map((t) => (
          <Button
            key={t.value}
            type="button"
            size="sm"
            variant={placementMode === t.value ? "default" : "outline"}
            onClick={() => quickPlace(t.value)}
          >
            <span className="size-2 rounded-sm" style={{ background: t.color }} />
            {t.label}
          </Button>
        ))}
        {placementMode && (
          <Button type="button" size="sm" variant="outline" onClick={() => setPlacementMode(null)}>
            Yerleştirme modunu kapat
          </Button>
        )}
        <label className="flex items-center gap-1.5 text-muted-foreground">
          <input type="checkbox" checked={continuous} onChange={(e) => setContinuous(e.target.checked)} />
          Sürekli yerleştirme
        </label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">İstasyon Boyutu</span>
          <input
            type="range"
            min={12}
            max={48}
            value={stationSize}
            onChange={(e) => setStationSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-muted-foreground">{stationSize}px</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" size="icon-sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
          <Minus className="size-3.5" />
        </Button>
        <span className="w-12 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button type="button" size="icon-sm" variant="outline" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}>
          <Plus className="size-3.5" />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setZoom(1)}>
          Sığdır
        </Button>
        <span className="text-xs text-muted-foreground">Ctrl + tekerlek ile yakınlaştır</span>
      </div>

      <div
        className="relative max-h-[420px] overflow-auto rounded-xl border border-border/60 bg-muted/20"
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div style={{ width: `${zoom * 100}%` }} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={sketch.imageDataUrl}
            alt={sketch.name}
            className={cn("block w-full select-none", placementMode && "cursor-crosshair")}
            onClick={handleCanvasClick}
            draggable={false}
          />
          {heatMapEnabled &&
            stations.map((s) => (
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
          {stations
            .filter((s) => layerVisibility[s.type] !== false)
            .map((s) => (
              <div
                key={s.id}
                onPointerDown={(e) => handleStationPointerDown(e, s.id)}
                className="group absolute flex cursor-grab items-center justify-center rounded-sm text-[9px] font-bold text-white shadow-md active:cursor-grabbing"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: stationSize,
                  height: stationSize,
                  background: stationColor(s.type),
                  transform: "translate(-50%, -50%)",
                }}
              >
                {stationNumbering.get(s.id)}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStation(s.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => downloadKroki({ ...sketch, stations, stationSize, layerVisibility })}>
          <Download className="size-4" />
          Krokiyi İndir
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button
          type="button"
          onClick={() =>
            onSave({ ...sketch, name: name.trim() || sketch.name, createdDate: date, stations, stationSize, heatMapEnabled, layerVisibility })
          }
        >
          Kaydet
        </Button>
      </DialogFooter>
    </div>
  );
}
