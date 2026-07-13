"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateLong } from "@/components/crm/crm-format";
import { KROKI_STATION_TYPES, numberStations, stationColor } from "@/components/crm/kroki-constants";
import {
  TUKETIM_OPTIONS,
  HAREKET_OPTIONS,
  RODENT_TUR_OPTIONS,
  OTHER_PEST_TUR_OPTIONS,
  DEGISIM_OPTIONS,
  UCKUN_TUR_OPTIONS,
  FLORASAN_OPTIONS,
} from "@/components/crm/istasyon-inspection-constants";
import { getKrokiSketchesFor } from "@/lib/kroki-store";
import { getInspectionsFor, saveInspectionsFor } from "@/lib/station-inspection-store";
import type { KrokiSketch, KrokiStation, KrokiStationType, PeriyotOccurrence, StationInspection } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

function comingSoon(feature: string) {
  toast.info(`${feature} — yakında`);
}

function emptyInspection(
  station: KrokiStation,
  occurrenceId: string,
  sketchId: string,
): StationInspection {
  return {
    id: `insp-${occurrenceId}-${station.id}`,
    periyotOccurrenceId: occurrenceId,
    krokiSketchId: sketchId,
    krokiStationId: station.id,
    stationType: station.type,
    tuketim: "",
    hareket: "",
    tur1: "",
    tur2: "",
    degisim: "",
    tur: "",
    sayim: "",
    olcum: "",
    florasanDurumu: "",
  };
}

interface IstasyonlarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string | null;
  occurrence: PeriyotOccurrence | null;
  customerName: string;
  batchName: string;
}

export function IstasyonlarDialog({ open, onOpenChange, serviceOrderId, occurrence, customerName, batchName }: IstasyonlarDialogProps) {
  const [sketches, setSketches] = useState<KrokiSketch[]>([]);
  const [selectedSketchId, setSelectedSketchId] = useState<string | null>(null);
  const [inspections, setInspections] = useState<Record<string, StationInspection>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && serviceOrderId) {
      setSketches(getKrokiSketchesFor(serviceOrderId));
      setSelectedSketchId(null);
      setInspections({});
    }
  }, [open, serviceOrderId]);

  const selectedSketch = sketches.find((s) => s.id === selectedSketchId) ?? null;

  useEffect(() => {
    if (!selectedSketch || !occurrence) {
      setInspections({});
      return;
    }
    const existing = getInspectionsFor(occurrence.id);
    const map: Record<string, StationInspection> = {};
    for (const station of selectedSketch.stations) {
      const found = existing.find((i) => i.krokiStationId === station.id);
      map[station.id] = found ?? emptyInspection(station, occurrence.id, selectedSketch.id);
    }
    setInspections(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSketchId, occurrence?.id]);

  const numbering = useMemo(() => (selectedSketch ? numberStations(selectedSketch.stations) : new Map()), [selectedSketch]);

  function updateField(stationId: string, patch: Partial<StationInspection>) {
    setInspections((prev) => ({ ...prev, [stationId]: { ...prev[stationId], ...patch } }));
  }

  function applyToAll(stationIds: string[], field: keyof StationInspection) {
    if (stationIds.length === 0) return;
    const firstValue = inspections[stationIds[0]]?.[field];
    setInspections((prev) => {
      const next = { ...prev };
      for (const id of stationIds) {
        next[id] = { ...next[id], [field]: firstValue };
      }
      return next;
    });
    toast.success("Tüm istasyonlara uygulandı");
  }

  function handleSave() {
    if (!occurrence || !selectedSketch) return;
    setSaving(true);
    saveInspectionsFor(occurrence.id, Object.values(inspections));
    setSaving(false);
    toast.success("İstasyon denetimi kaydedildi");
  }

  const summary = useMemo(() => {
    if (!selectedSketch) return null;
    const stations = selectedSketch.stations;
    const byType = KROKI_STATION_TYPES.map((t) => ({
      type: t,
      count: stations.filter((s) => s.type === t.value).length,
    }));
    let activityCount = 0;
    const activityByType: Record<string, number> = {};
    for (const station of stations) {
      const insp = inspections[station.id];
      if (!insp) continue;
      let hasActivity = false;
      if (station.type === "zehirli" && insp.tuketim === "Yem Tüketimi Var") hasActivity = true;
      if (station.type === "zehirsiz" && insp.hareket === "Hareket Var") hasActivity = true;
      if ((station.type === "ic_uckun" || station.type === "dis_uckun") && Number(insp.sayim) > 0) hasActivity = true;
      if (hasActivity) {
        activityCount += 1;
        activityByType[station.type] = (activityByType[station.type] ?? 0) + 1;
      }
    }
    const total = stations.length;
    const topType = Object.entries(activityByType).sort((a, b) => b[1] - a[1])[0];
    return {
      byType,
      total,
      activityCount,
      activityRate: total > 0 ? Math.round((activityCount / total) * 100) : 0,
      topGroup: topType ? KROKI_STATION_TYPES.find((t) => t.value === topType[0])?.label : "Aktivite yok / düşük",
    };
  }, [selectedSketch, inspections]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>İstasyonlar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={selectedSketchId ?? undefined} onValueChange={(v) => setSelectedSketchId(String(v))}>
            <SelectTrigger className="h-11 w-full rounded-xl px-3.5 sm:max-w-xs">
              <SelectValue placeholder="Kroki Seçiniz…">
                {() => (selectedSketch ? `${selectedSketch.name} (${selectedSketch.stations.length} istasyon)` : "Kroki Seçiniz…")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sketches.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.stations.length} istasyon)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSketch && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => comingSoon("İstasyon QR Kod Etiketi İndir")}>
                <Download className="size-3.5" />
                İstasyon QR Kod Etiketi İndir
              </Button>
              <Button variant="outline" size="sm" onClick={() => comingSoon("PDF Raporu")}>
                <FileText className="size-3.5" />
                PDF Raporu
              </Button>
            </div>
          )}
        </div>

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Rapor Bilgileri</p>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <InfoRow label="Müşteri" value={customerName} />
                <InfoRow label="Hizmet" value={batchName} />
                <InfoRow label="Periyot Tarihi" value={occurrence ? formatDateLong(occurrence.periodDate) : "—"} />
                <InfoRow label="Kroki" value={selectedSketch?.name ?? "—"} />
              </dl>
            </div>

            {!selectedSketch ? (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">İstasyon Bulunamadı.</div>
            ) : selectedSketch.stations.length === 0 ? (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                Bu krokide henüz istasyon işaretlenmemiş.
              </div>
            ) : (
              <>
                {summary && (
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="mb-2 text-sm font-semibold text-foreground">Genel Özet</p>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                      <InfoRow label="İncelenen Periyot" value={occurrence?.periodDate ?? "—"} />
                      <InfoRow
                        label="Toplam İstasyon"
                        value={`${summary.total} (${summary.byType.map((t) => `${t.type.label}: ${t.count}`).join(", ")})`}
                      />
                      <InfoRow label="Aktivite Görülen İstasyon" value={`${summary.activityCount} (Oran: %${summary.activityRate})`} />
                      <InfoRow label="En Sık Görülen Grup" value={summary.topGroup ?? "Aktivite yok / düşük"} />
                      <InfoRow label="Önceki Periyot Kıyası" value="Önceki periyot seçilmedi." />
                    </dl>
                  </div>
                )}

                {KROKI_STATION_TYPES.map((t) => {
                  const stations = selectedSketch.stations.filter((s) => s.type === t.value);
                  if (stations.length === 0) return null;
                  return (
                    <StationTypeSection
                      key={t.value}
                      type={t.value}
                      label={t.label}
                      color={t.color}
                      stations={stations}
                      numbering={numbering}
                      inspections={inspections}
                      onUpdate={updateField}
                      onApplyAll={applyToAll}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button type="button" loading={saving} disabled={!selectedSketch} onClick={handleSave}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function UygulaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success hover:bg-success/25"
    >
      Uygula
    </button>
  );
}

function FieldSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <Select value={value || "-"} onValueChange={(v) => onChange(v === "-" ? "" : String(v))}>
      <SelectTrigger className={cn("h-9 w-full rounded-lg px-2.5 text-xs", className)}>
        <SelectValue>{() => value || "-"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="-">-</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface StationTypeSectionProps {
  type: KrokiStationType;
  label: string;
  color: string;
  stations: KrokiStation[];
  numbering: Map<string, number>;
  inspections: Record<string, StationInspection>;
  onUpdate: (stationId: string, patch: Partial<StationInspection>) => void;
  onApplyAll: (stationIds: string[], field: keyof StationInspection) => void;
}

function StationTypeSection({ type, label, color, stations, numbering, inspections, onUpdate, onApplyAll }: StationTypeSectionProps) {
  const ids = stations.map((s) => s.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <span className="size-2.5 rounded-sm" style={{ background: color }} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>İstasyon</TableHead>
              {type === "zehirli" && (
                <TableHead>
                  <span className="flex items-center gap-1.5">
                    Tüketim
                    <UygulaButton onClick={() => onApplyAll(ids, "tuketim")} />
                  </span>
                </TableHead>
              )}
              {type === "zehirsiz" && (
                <>
                  <TableHead>
                    <span className="flex items-center gap-1.5">
                      Hareket
                      <UygulaButton onClick={() => onApplyAll(ids, "hareket")} />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1.5">
                      Tür
                      <UygulaButton onClick={() => onApplyAll(ids, "tur1")} />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1.5">
                      Tür
                      <UygulaButton onClick={() => onApplyAll(ids, "tur2")} />
                    </span>
                  </TableHead>
                </>
              )}
              {(type === "ic_uckun" || type === "dis_uckun") && (
                <>
                  <TableHead>
                    <span className="flex items-center gap-1.5">
                      Değişim
                      <UygulaButton onClick={() => onApplyAll(ids, "degisim")} />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1.5">
                      Tür
                      <UygulaButton onClick={() => onApplyAll(ids, "tur")} />
                    </span>
                  </TableHead>
                  <TableHead>Sayım</TableHead>
                  {type === "ic_uckun" && (
                    <>
                      <TableHead>Ölçüm</TableHead>
                      <TableHead>
                        <span className="flex items-center gap-1.5">
                          Floresan Durumu
                          <UygulaButton onClick={() => onApplyAll(ids, "florasanDurumu")} />
                        </span>
                      </TableHead>
                    </>
                  )}
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((station) => {
              const insp = inspections[station.id];
              if (!insp) return null;
              return (
                <TableRow key={station.id}>
                  <TableCell className="font-medium whitespace-nowrap">İstasyon {numbering.get(station.id)}</TableCell>
                  {type === "zehirli" && (
                    <TableCell className="min-w-[160px]">
                      <FieldSelect value={insp.tuketim} onChange={(v) => onUpdate(station.id, { tuketim: v })} options={TUKETIM_OPTIONS} />
                    </TableCell>
                  )}
                  {type === "zehirsiz" && (
                    <>
                      <TableCell className="min-w-[150px]">
                        <FieldSelect value={insp.hareket} onChange={(v) => onUpdate(station.id, { hareket: v })} options={HAREKET_OPTIONS} />
                      </TableCell>
                      <TableCell className="min-w-[170px]">
                        <FieldSelect value={insp.tur1} onChange={(v) => onUpdate(station.id, { tur1: v })} options={RODENT_TUR_OPTIONS} />
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <FieldSelect value={insp.tur2} onChange={(v) => onUpdate(station.id, { tur2: v })} options={OTHER_PEST_TUR_OPTIONS} />
                      </TableCell>
                    </>
                  )}
                  {(type === "ic_uckun" || type === "dis_uckun") && (
                    <>
                      <TableCell className="min-w-[160px]">
                        <FieldSelect value={insp.degisim} onChange={(v) => onUpdate(station.id, { degisim: v })} options={DEGISIM_OPTIONS} />
                      </TableCell>
                      <TableCell className="min-w-[130px]">
                        <FieldSelect value={insp.tur} onChange={(v) => onUpdate(station.id, { tur: v })} options={UCKUN_TUR_OPTIONS} />
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <Input
                          type="number"
                          value={insp.sayim}
                          onChange={(e) => onUpdate(station.id, { sayim: e.target.value })}
                          className="h-9 w-20 rounded-lg px-2 text-xs"
                        />
                      </TableCell>
                      {type === "ic_uckun" && (
                        <>
                          <TableCell className="min-w-[80px]">
                            <Input
                              type="number"
                              value={insp.olcum}
                              onChange={(e) => onUpdate(station.id, { olcum: e.target.value })}
                              className="h-9 w-20 rounded-lg px-2 text-xs"
                            />
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            <FieldSelect value={insp.florasanDurumu} onChange={(v) => onUpdate(station.id, { florasanDurumu: v })} options={FLORASAN_OPTIONS} />
                          </TableCell>
                        </>
                      )}
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
