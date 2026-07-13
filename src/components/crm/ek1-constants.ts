// EK-1 formunun "Kullanılan Malzemeler" alanına karşılık gelen sabit ekipman
// tipi listesi — hangi periyot/müşteri olursa olsun her zaman aynı 9 tip sunulur.

export const MALZEME_TYPES: { key: string; label: string }[] = [
  { key: "yapiskan_plaka", label: "Yapışkan Plaka (Adet)" },
  { key: "fare_yapiskani", label: "Fare Yapışkanı (Adet)" },
  { key: "guve_tuzagi", label: "Güve Tuzağı (Adet)" },
  { key: "guve_feromonu", label: "Güve Feromonu (Adet)" },
  { key: "canli_yakalama_ist", label: "Canlı Yakalama İst. (Adet)" },
  { key: "kemirgen_ist", label: "Kemirgen İst. (Adet)" },
  { key: "karasinek_monitoru", label: "Karasinek Monitörü (Adet)" },
  { key: "uv_lamba", label: "UV Lamba (Floresan)" },
  { key: "efk_cihazi", label: "EFK Cihazı" },
];

export function malzemeLabel(key: string): string {
  return MALZEME_TYPES.find((m) => m.key === key)?.label ?? key;
}

/** Kaydedilen malzeme kullanım listesinden EK-1'in serbest metin alanı için özet metin üretir. */
export function summarizeMalzemeler(usages: { key: string; adet: string; kullanildi: boolean }[]): string {
  return usages
    .filter((u) => u.kullanildi && u.adet && Number(u.adet) > 0)
    .map((u) => `${malzemeLabel(u.key)}: ${u.adet}`)
    .join(", ");
}
