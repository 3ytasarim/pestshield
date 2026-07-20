// "Kat Planı İstasyon Raporu" — bir tek krokiye ait istasyonların en güncel
// denetim durumunu listeleyen, o krokiye özel (trend analizi değil) rapor verisi.
// Bu dosya istemci tarafında (PDF üretici) da kullanıldığı için sade tutulur;
// gerçek veri sorgusu için bkz. src/lib/kat-plani-report-server.ts.

import type { KrokiStation, StationInspection } from "@/lib/mock/crm";

export interface StationReportRow {
  station: KrokiStation;
  istasyonNo: number;
  lastInspection: StationInspection | null;
  lastInspectionDate: string | null;
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
