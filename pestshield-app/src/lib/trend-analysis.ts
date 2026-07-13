// "Trend Analiz Raporu" — bir HİZMETE (serviceOrderId) ait TÜM krokilerdeki
// istasyonların, periyot ziyaretleri boyunca aylık bazda toplanan denetim
// kayıtlarından (StationInspection) üretilen genel/toplulaştırılmış karşılaştırmalı
// analiz verisi. Krokiye özel değil, hizmetin geneli için tek bir analizdir.
// Her ay için o ayın SON periyot ziyaretindeki kayıtlar temsilci alınır.

import type { KrokiSketch, KrokiStation, KrokiStationType, PeriyotOccurrence, StationInspection } from "@/lib/mock/crm";
import { KROKI_STATION_TYPES, numberStations, stationLabel } from "@/components/crm/kroki-constants";
import { getKrokiSketchesFor } from "@/lib/kroki-store";
import { getBatchesFor, getOccurrencesFor } from "@/lib/periyot-store";
import { getInspectionsFor } from "@/lib/station-inspection-store";

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabelOf(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${AY_ADLARI[m - 1]} ${y}`;
}

export interface TrendMonthEntry {
  monthKey: string;
  monthLabel: string;
  occurrenceId: string;
  occurrenceDate: string;
  inspections: Record<string, StationInspection>;
}

export interface TrendComparisonRow {
  stationId: string;
  krokiName: string;
  istasyonNo: number;
  cells: { monthLabel: string; occurrenceDate: string; primary: string; secondary?: string; tone: "bad" | "good" | "neutral" }[];
}

export interface TrendRiskRow {
  periyotTarihi: string;
  krokiName: string;
  istasyonNo: number;
  turLabel: string;
  sayim: number;
}

export interface TrendAnalysis {
  sketches: KrokiSketch[];
  months: TrendMonthEntry[];
  totalStations: number;
  byTypeCounts: { type: KrokiStationType; label: string; count: number }[];
  hasEnoughData: boolean;
  activeStationRatioLatest: number;
  activeStationRatioPrevious: number | null;
  previousComparisonText: string;
  topGroupLabel: string;
  dominantTur: string | null;
  activityRateSeries: { monthLabel: string; "Aktif Zehirsiz (%)": number; "Aktif Zehirli (%)": number }[];
  zehirliSeries: { monthLabel: string; "Yem Tüketimi Var": number; "Yem Tüketimi Yok": number; "İstasyon Kırık / Kayıp": number }[];
  zehirsizSeries: { monthLabel: string; "Hareket Var": number; "Hareket Yok": number; "İstasyon Kırık / Kayıp": number }[];
  zehirsizTurDagilimi: { name: string; value: number }[];
  icUckunSeries: Record<string, string | number>[];
  icUckunTurKeys: string[];
  uckunSayimTrend: { monthLabel: string; "İç Alan": number; "Dış Alan": number }[];
  icUckunFlorasan: { krokiName: string; istasyonNo: number; sonDegisimTarihi: string; kacGunOnce: number }[];
  riskTopIc: TrendRiskRow[];
  riskTopDis: TrendRiskRow[];
  comparisonTables: Partial<Record<KrokiStationType, TrendComparisonRow[]>>;
  biocidalRecords: { monthLabel: string; occurrenceDate: string; text: string }[];
}

function allOccurrencesFor(serviceOrderId: string): PeriyotOccurrence[] {
  const batches = getBatchesFor(serviceOrderId);
  return batches
    .flatMap((b) => getOccurrencesFor(b.id))
    .sort((a, b) => (a.periodDate < b.periodDate ? -1 : a.periodDate > b.periodDate ? 1 : 0));
}

/** Bir hizmete ait tüm istasyonları, hangi krokiye ait olduğu bilgisiyle birlikte
 * tek bir listede toplar. Pin numaraları krokiye özel (kroki editöründeki ile
 * aynı) kalsın diye numaralandırma her kroki için ayrı ayrı hesaplanır. */
function flattenStations(sketches: KrokiSketch[]): {
  station: KrokiStation;
  sketchName: string;
  numbering: Map<string, number>;
}[] {
  const result: { station: KrokiStation; sketchName: string; numbering: Map<string, number> }[] = [];
  for (const sketch of sketches) {
    const numbering = numberStations(sketch.stations);
    for (const station of sketch.stations) {
      result.push({ station, sketchName: sketch.name, numbering });
    }
  }
  return result;
}

export function computeTrendAnalysis(serviceOrderId: string, asOfMonthKey?: string): TrendAnalysis {
  const sketches = getKrokiSketchesFor(serviceOrderId);
  const sketchIds = new Set(sketches.map((s) => s.id));
  const occurrences = allOccurrencesFor(serviceOrderId);

  const byMonth = new Map<string, PeriyotOccurrence>();
  for (const occ of occurrences) {
    const insp = getInspectionsFor(occ.id).filter((i) => sketchIds.has(i.krokiSketchId));
    if (insp.length === 0) continue;
    const key = monthKeyOf(occ.periodDate);
    const existing = byMonth.get(key);
    if (!existing || occ.periodDate >= existing.periodDate) byMonth.set(key, occ);
  }

  let months: TrendMonthEntry[] = Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([monthKey, occ]) => {
      const inspList = getInspectionsFor(occ.id).filter((i) => sketchIds.has(i.krokiSketchId));
      const inspections: Record<string, StationInspection> = {};
      for (const i of inspList) inspections[i.krokiStationId] = i;
      return { monthKey, monthLabel: monthLabelOf(occ.periodDate), occurrenceId: occ.id, occurrenceDate: occ.periodDate, inspections };
    });

  if (asOfMonthKey) months = months.filter((m) => m.monthKey <= asOfMonthKey);

  const allStations = flattenStations(sketches);
  function stationsByType(t: KrokiStationType) {
    return allStations.filter((e) => e.station.type === t);
  }
  const byTypeCounts = KROKI_STATION_TYPES.map((t) => ({ type: t.value, label: t.label, count: stationsByType(t.value).length }));
  const totalStations = allStations.length;

  const latest = months.at(-1) ?? null;
  const previous = months.length > 1 ? months.at(-2)! : null;

  function activeRatioFor(entry: TrendMonthEntry | null): { zehirsiz: number | null; zehirli: number | null; overall: number } {
    if (!entry) return { zehirsiz: null, zehirli: null, overall: 0 };
    const zehirsizStations = stationsByType("zehirsiz");
    const zehirliStations = stationsByType("zehirli");
    const zehirsizActive = zehirsizStations.filter((e) => entry.inspections[e.station.id]?.hareket === "Hareket Var").length;
    const zehirliActive = zehirliStations.filter((e) => entry.inspections[e.station.id]?.tuketim === "Yem Tüketimi Var").length;
    const zehirsizRatio = zehirsizStations.length > 0 ? Math.round((zehirsizActive / zehirsizStations.length) * 100) : null;
    const zehirliRatio = zehirliStations.length > 0 ? Math.round((zehirliActive / zehirliStations.length) * 100) : null;
    const parts = [zehirsizRatio, zehirliRatio].filter((v): v is number => v !== null);
    const overall = parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
    return { zehirsiz: zehirsizRatio, zehirli: zehirliRatio, overall };
  }

  const latestRatio = activeRatioFor(latest);
  const previousRatio = previous ? activeRatioFor(previous) : null;

  let previousComparisonText = "Kıyaslama için en az 2 periyot verisi gerekir.";
  if (previousRatio) {
    const diff = latestRatio.overall - previousRatio.overall;
    if (diff > 0) previousComparisonText = `Önceki ay ortalamasına göre aktiflik oranı ${diff} puan arttı.`;
    else if (diff < 0) previousComparisonText = `Önceki ay ortalamasına göre aktiflik oranı ${Math.abs(diff)} puan azaldı.`;
    else previousComparisonText = "Önceki ay ortalamasına göre aktiflik oranı değişmedi.";
  }

  // En sık görülen grup + baskın tür (son ay verisine göre, tüm krokiler dahil)
  const activityByType: Record<string, number> = {};
  const turCounts = new Map<string, number>();
  if (latest) {
    for (const { station } of allStations) {
      const insp = latest.inspections[station.id];
      if (!insp) continue;
      let active = false;
      if (station.type === "zehirli" && insp.tuketim === "Yem Tüketimi Var") active = true;
      if (station.type === "zehirsiz" && insp.hareket === "Hareket Var") active = true;
      if ((station.type === "ic_uckun" || station.type === "dis_uckun") && Number(insp.sayim) > 0) active = true;
      if (active) activityByType[station.type] = (activityByType[station.type] ?? 0) + 1;

      for (const tur of [insp.tur1, insp.tur2, insp.tur]) {
        if (tur) turCounts.set(tur, (turCounts.get(tur) ?? 0) + 1);
      }
    }
  }
  const topTypeEntry = Object.entries(activityByType).sort((a, b) => b[1] - a[1])[0];
  const topGroupLabel = topTypeEntry ? stationLabel(topTypeEntry[0] as KrokiStationType) : "Aktivite yok / düşük";
  const dominantTurEntry = Array.from(turCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const dominantTur = dominantTurEntry ? dominantTurEntry[0] : null;

  // Ay/Periyot aktiflik serisi
  const activityRateSeries = months.map((m) => {
    const r = activeRatioFor(m);
    return { monthLabel: m.monthLabel, "Aktif Zehirsiz (%)": r.zehirsiz ?? 0, "Aktif Zehirli (%)": r.zehirli ?? 0 };
  });

  // Zehirli zaman serisi (tüketim durumu dağılımı)
  const zehirliStations = stationsByType("zehirli");
  const zehirliSeries = months.map((m) => {
    let varC = 0, yokC = 0, kirikC = 0;
    for (const { station } of zehirliStations) {
      const v = m.inspections[station.id]?.tuketim;
      if (v === "Yem Tüketimi Var") varC += 1;
      else if (v === "Yem Tüketimi Yok") yokC += 1;
      else if (v === "İstasyon Kırık / Kayıp") kirikC += 1;
    }
    return { monthLabel: m.monthLabel, "Yem Tüketimi Var": varC, "Yem Tüketimi Yok": yokC, "İstasyon Kırık / Kayıp": kirikC };
  });

  // Zehirsiz zaman serisi (hareket durumu) + tür dağılımı (son ay)
  const zehirsizStations = stationsByType("zehirsiz");
  const zehirsizSeries = months.map((m) => {
    let varC = 0, yokC = 0, kirikC = 0;
    for (const { station } of zehirsizStations) {
      const v = m.inspections[station.id]?.hareket;
      if (v === "Hareket Var") varC += 1;
      else if (v === "Hareket Yok") yokC += 1;
      else if (v === "İstasyon Kırık / Kayıp") kirikC += 1;
    }
    return { monthLabel: m.monthLabel, "Hareket Var": varC, "Hareket Yok": yokC, "İstasyon Kırık / Kayıp": kirikC };
  });
  const zehirsizTurMap = new Map<string, number>();
  if (latest) {
    for (const { station } of zehirsizStations) {
      const insp = latest.inspections[station.id];
      for (const tur of [insp?.tur1, insp?.tur2]) {
        if (tur) zehirsizTurMap.set(tur, (zehirsizTurMap.get(tur) ?? 0) + 1);
      }
    }
  }
  const zehirsizTurDagilimi = Array.from(zehirsizTurMap.entries()).map(([name, value]) => ({ name, value }));

  // İç Alan Uçkun tür bazlı stacked sayım
  const icStations = stationsByType("ic_uckun");
  const icTurSet = new Set<string>();
  for (const m of months) for (const { station } of icStations) { const t = m.inspections[station.id]?.tur; if (t) icTurSet.add(t); }
  const icUckunTurKeys = Array.from(icTurSet);
  const icUckunSeries = months.map((m) => {
    const row: Record<string, string | number> = { monthLabel: m.monthLabel };
    for (const key of icUckunTurKeys) row[key] = 0;
    for (const { station } of icStations) {
      const insp = m.inspections[station.id];
      if (insp?.tur) row[insp.tur] = (Number(row[insp.tur]) || 0) + (Number(insp.sayim) || 0);
    }
    return row;
  });

  // Uçkun sayım trendi (iç/dış alan toplam)
  const disStations = stationsByType("dis_uckun");
  const uckunSayimTrend = months.map((m) => {
    const icTotal = icStations.reduce((sum, { station }) => sum + (Number(m.inspections[station.id]?.sayim) || 0), 0);
    const disTotal = disStations.reduce((sum, { station }) => sum + (Number(m.inspections[station.id]?.sayim) || 0), 0);
    return { monthLabel: m.monthLabel, "İç Alan": icTotal, "Dış Alan": disTotal };
  });

  // İç Alan Uçkun son floresan değişim tarihi
  const icUckunFlorasan = icStations
    .map(({ station, sketchName, numbering }) => {
      let lastChangeDate: string | null = null;
      for (const m of months) {
        if (m.inspections[station.id]?.florasanDurumu === "Değiştirildi") lastChangeDate = m.occurrenceDate;
      }
      if (!lastChangeDate) return null;
      const kacGunOnce = Math.round((Date.now() - new Date(lastChangeDate).getTime()) / 86_400_000);
      return { krokiName: sketchName, istasyonNo: numbering.get(station.id) ?? 0, sonDegisimTarihi: lastChangeDate, kacGunOnce };
    })
    .filter((v): v is { krokiName: string; istasyonNo: number; sonDegisimTarihi: string; kacGunOnce: number } => v !== null);

  // Risk haritası top 5 (son aya göre, tüm krokiler dahil)
  function topRisk(stations: typeof allStations, turLabel: string): TrendRiskRow[] {
    if (!latest) return [];
    return stations
      .map(({ station, sketchName, numbering }) => ({
        periyotTarihi: latest.occurrenceDate,
        krokiName: sketchName,
        istasyonNo: numbering.get(station.id) ?? 0,
        turLabel,
        sayim: Number(latest.inspections[station.id]?.sayim) || 0,
      }))
      .sort((a, b) => b.sayim - a.sayim)
      .slice(0, 5);
  }
  const riskTopIc = topRisk(icStations, "İç Alan");
  const riskTopDis = topRisk(disStations, "Dış Alan");

  // Detaylı karşılaştırma tabloları (istasyon x ay, tüm krokiler dahil)
  function toneFor(type: KrokiStationType, value: string): "bad" | "good" | "neutral" {
    if (value === "Yem Tüketimi Var" || value === "Hareket Var") return "bad";
    if (value === "Yem Tüketimi Yok" || value === "Hareket Yok") return "good";
    if (value === "İstasyon Kırık / Kayıp") return "bad";
    return "neutral";
  }

  const comparisonTables: Partial<Record<KrokiStationType, TrendComparisonRow[]>> = {};
  for (const t of KROKI_STATION_TYPES) {
    const stations = stationsByType(t.value);
    if (stations.length === 0) continue;
    comparisonTables[t.value] = stations.map(({ station: s, sketchName, numbering }) => ({
      stationId: s.id,
      krokiName: sketchName,
      istasyonNo: numbering.get(s.id) ?? 0,
      cells: months.map((m) => {
        const insp = m.inspections[s.id];
        if (!insp) return { monthLabel: m.monthLabel, occurrenceDate: m.occurrenceDate, primary: "—", tone: "neutral" as const };
        if (t.value === "zehirli") {
          return { monthLabel: m.monthLabel, occurrenceDate: m.occurrenceDate, primary: insp.tuketim || "—", tone: toneFor(t.value, insp.tuketim || "") };
        }
        if (t.value === "zehirsiz") {
          const secondary = [insp.tur1, insp.tur2].filter(Boolean).join(" / ") || undefined;
          return { monthLabel: m.monthLabel, occurrenceDate: m.occurrenceDate, primary: insp.hareket || "—", secondary, tone: toneFor(t.value, insp.hareket || "") };
        }
        const primary = `Sayım: ${insp.sayim || "0"}`;
        const secondary = t.value === "ic_uckun" && insp.florasanDurumu ? `Floresan: ${insp.florasanDurumu}` : insp.tur || undefined;
        return { monthLabel: m.monthLabel, occurrenceDate: m.occurrenceDate, primary, secondary, tone: "neutral" as const };
      }),
    }));
  }

  // Biyosidal ürün kayıtları
  const biocidalRecords = months
    .filter((m) => {
      const occ = occurrences.find((o) => o.id === m.occurrenceId);
      return occ?.biocidalProducts?.trim();
    })
    .map((m) => {
      const occ = occurrences.find((o) => o.id === m.occurrenceId)!;
      return { monthLabel: m.monthLabel, occurrenceDate: m.occurrenceDate, text: occ.biocidalProducts };
    });

  return {
    sketches,
    months,
    totalStations,
    byTypeCounts,
    hasEnoughData: months.length >= 2,
    activeStationRatioLatest: latestRatio.overall,
    activeStationRatioPrevious: previousRatio?.overall ?? null,
    previousComparisonText,
    topGroupLabel,
    dominantTur,
    activityRateSeries,
    zehirliSeries,
    zehirsizSeries,
    zehirsizTurDagilimi,
    icUckunSeries,
    icUckunTurKeys,
    uckunSayimTrend,
    icUckunFlorasan,
    riskTopIc,
    riskTopDis,
    comparisonTables,
    biocidalRecords,
  };
}
