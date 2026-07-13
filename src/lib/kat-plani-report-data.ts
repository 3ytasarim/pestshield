// "Kat Planı İstasyon Raporu" — bir tek krokiye ait istasyonların en güncel
// denetim durumunu listeleyen, o krokiye özel (trend analizi değil) rapor verisi.

import { numberStations } from "@/components/crm/kroki-constants";
import { getBatchesFor, getOccurrencesFor } from "@/lib/periyot-store";
import { getInspectionsFor } from "@/lib/station-inspection-store";
import type { KrokiSketch, KrokiStation, StationInspection } from "@/lib/mock/crm";

export interface StationReportRow {
  station: KrokiStation;
  istasyonNo: number;
  lastInspection: StationInspection | null;
  lastInspectionDate: string | null;
}

export function buildStationReportRows(serviceOrderId: string, sketch: KrokiSketch): StationReportRow[] {
  const numbering = numberStations(sketch.stations);
  const occurrences = getBatchesFor(serviceOrderId)
    .flatMap((b) => getOccurrencesFor(b.id))
    .sort((a, b) => (a.periodDate < b.periodDate ? 1 : a.periodDate > b.periodDate ? -1 : 0));

  return sketch.stations.map((station) => {
    let lastInspection: StationInspection | null = null;
    let lastInspectionDate: string | null = null;
    for (const occ of occurrences) {
      const insp = getInspectionsFor(occ.id).find((i) => i.krokiStationId === station.id && i.krokiSketchId === sketch.id);
      if (insp) {
        lastInspection = insp;
        lastInspectionDate = occ.periodDate;
        break;
      }
    }
    return { station, istasyonNo: numbering.get(station.id) ?? 0, lastInspection, lastInspectionDate };
  });
}

export function statusSummary(row: StationReportRow): string {
  const insp = row.lastInspection;
  if (!insp) return "Denetim kaydı yok";
  switch (row.station.type) {
    case "zehirli":
      return insp.tuketim || "—";
    case "zehirsiz":
      return insp.hareket || "—";
    case "ic_uckun":
    case "dis_uckun": {
      const parts = [`Sayım: ${insp.sayim || "0"}`];
      if (insp.tur) parts.push(insp.tur);
      if (row.station.type === "ic_uckun" && insp.florasanDurumu) parts.push(`Floresan: ${insp.florasanDurumu}`);
      return parts.join(" · ");
    }
    default:
      return "—";
  }
}
