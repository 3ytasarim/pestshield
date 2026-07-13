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

/** İstasyonları tip sırasına göre gruplayıp global sıra numarası atar — kroki üzerindeki
 * pin numaraları ile İstasyon ID popup'ındaki "İstasyon N" etiketleri tutarlı kalsın diye. */
export function numberStations(stations: KrokiStation[]): Map<string, number> {
  const numbering = new Map<string, number>();
  let counter = 1;
  for (const t of KROKI_STATION_TYPES) {
    for (const station of stations) {
      if (station.type === t.value) {
        numbering.set(station.id, counter);
        counter += 1;
      }
    }
  }
  return numbering;
}
