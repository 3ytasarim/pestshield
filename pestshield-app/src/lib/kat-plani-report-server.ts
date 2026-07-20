// Sunucu tarafı veri sorgusu — "Kat Planı İstasyon Raporu" için gerçek
// PeriyotOccurrence/StationInspection kayıtlarını Prisma'dan okur.
// İstemci bileşenlerinden ASLA doğrudan içe aktarılmamalı (bkz. kat-plani-report-data.ts).

import { numberStations } from "@/components/crm/kroki-constants";
import { prisma } from "@/lib/db";
import { serializeStationInspection } from "@/lib/kroki/serialize";
import type { KrokiSketch, StationInspection } from "@/lib/mock/crm";
import type { StationReportRow } from "@/lib/kat-plani-report-data";

export async function buildStationReportRows(ownerId: string, serviceOrderId: string, sketch: KrokiSketch): Promise<StationReportRow[]> {
  const numbering = numberStations(sketch.stations);
  const [occurrences, inspectionRecords] = await Promise.all([
    prisma.periyotOccurrence.findMany({
      where: { ownerId, serviceOrderId },
      select: { id: true, periodDate: true },
      orderBy: { periodDate: "desc" },
    }),
    prisma.stationInspection.findMany({ where: { ownerId, krokiSketchId: sketch.id } }),
  ]);
  const inspections = inspectionRecords.map(serializeStationInspection);
  const inspectionsByOccurrence = new Map<string, StationInspection[]>();
  for (const insp of inspections) {
    const list = inspectionsByOccurrence.get(insp.periyotOccurrenceId) ?? [];
    list.push(insp);
    inspectionsByOccurrence.set(insp.periyotOccurrenceId, list);
  }

  return sketch.stations.map((station) => {
    let lastInspection: StationInspection | null = null;
    let lastInspectionDate: string | null = null;
    for (const occ of occurrences) {
      const insp = (inspectionsByOccurrence.get(occ.id) ?? []).find((i) => i.krokiStationId === station.id);
      if (insp) {
        lastInspection = insp;
        lastInspectionDate = occ.periodDate;
        break;
      }
    }
    return { station, istasyonNo: numbering.get(station.id) ?? 0, lastInspection, lastInspectionDate };
  });
}
