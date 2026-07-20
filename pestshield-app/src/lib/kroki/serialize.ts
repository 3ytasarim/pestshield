import type {
  KrokiSketch as PrismaKrokiSketch,
  KrokiStation as PrismaKrokiStation,
  StationInspection as PrismaStationInspection,
} from "@/generated/prisma";
import type { KrokiSketch, KrokiStation, KrokiStationType, StationInspection } from "@/lib/mock/crm";

export function serializeKrokiStation(station: PrismaKrokiStation): KrokiStation {
  return {
    id: station.id,
    type: station.type as KrokiStationType,
    x: station.x,
    y: station.y,
    stationId: station.stationId,
  };
}

export function serializeKrokiSketch(
  sketch: PrismaKrokiSketch & { stations?: PrismaKrokiStation[] },
): KrokiSketch {
  return {
    id: sketch.id,
    serviceOrderId: sketch.serviceOrderId,
    name: sketch.name,
    createdDate: sketch.createdDate,
    imageDataUrl: sketch.imageDataUrl,
    fileSizeKb: sketch.fileSizeKb,
    stations: (sketch.stations ?? []).map(serializeKrokiStation),
    stationSize: sketch.stationSize,
    heatMapEnabled: sketch.heatMapEnabled,
    layerVisibility: {
      zehirli: sketch.zehirliVisible,
      zehirsiz: sketch.zehirsizVisible,
      ic_uckun: sketch.icUckunVisible,
      dis_uckun: sketch.disUckunVisible,
    },
    createdAt: sketch.createdAt,
  };
}

export function serializeStationInspection(inspection: PrismaStationInspection): StationInspection {
  return {
    id: inspection.id,
    periyotOccurrenceId: inspection.periyotOccurrenceId,
    krokiSketchId: inspection.krokiSketchId,
    krokiStationId: inspection.krokiStationId,
    stationType: inspection.stationType as KrokiStationType,
    tuketim: inspection.tuketim ?? undefined,
    hareket: inspection.hareket ?? undefined,
    tur1: inspection.tur1 ?? undefined,
    tur2: inspection.tur2 ?? undefined,
    degisim: inspection.degisim ?? undefined,
    tur: inspection.tur ?? undefined,
    sayim: inspection.sayim ?? undefined,
    olcum: inspection.olcum ?? undefined,
    florasanDurumu: inspection.florasanDurumu ?? undefined,
  };
}
