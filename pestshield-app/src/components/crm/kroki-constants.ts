import type { KrokiStation, KrokiStationType } from "@/lib/mock/crm";

export const KROKI_STATION_TYPES: { value: KrokiStationType; label: string; color: string }[] = [
  { value: "zehirli", label: "Zehirli İstasyon", color: "#2563eb" },
  { value: "zehirsiz", label: "Zehirsiz İstasyon", color: "#16a34a" },
  { value: "ic_uckun", label: "İç Alan Uçkun İstasyon", color: "#dc2626" },
  { value: "dis_uckun", label: "Dış Alan Uçkun İstasyon", color: "#ea580c" },
];

export function stationLabel(type: KrokiStationType): string {
  return KROKI_STATION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function stationColor(type: KrokiStationType): string {
  return KROKI_STATION_TYPES.find((t) => t.value === type)?.color ?? "#64748b";
}

/** İstasyonları tip sırasına göre gruplayıp sıra numarası atar — kroki üzerindeki
 * pin numaraları ile İstasyon ID popup'ındaki "İstasyon N" etiketleri tutarlı kalsın diye.
 * Manuel/kaydedilmiş `number` değeri olan istasyonlar aynen korunur; numarası olmayanlara
 * (yeni yerleştirilenler) `startOffset`'ten devam eden boşta kalan ilk numaralar atanır —
 * böylece "Zemin Kat" 1-3 aldıysa "1. Kat" 4'ten başlar (bkz. kroki-dialog.tsx `siblingOffset`). */
export function numberStations(stations: KrokiStation[], startOffset = 0): Map<string, number> {
  const numbering = new Map<string, number>();
  const used = new Set<number>();
  for (const station of stations) {
    if (station.number != null) {
      numbering.set(station.id, station.number);
      used.add(station.number);
    }
  }
  let counter = startOffset + 1;
  for (const t of KROKI_STATION_TYPES) {
    for (const station of stations) {
      if (station.type === t.value && !numbering.has(station.id)) {
        while (used.has(counter)) counter += 1;
        numbering.set(station.id, counter);
        used.add(counter);
        counter += 1;
      }
    }
  }
  return numbering;
}
