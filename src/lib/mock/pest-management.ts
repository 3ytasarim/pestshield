// PestShield Pest Yönetimi mock veri katmanı. Gerçek backend henüz bağlanmadı;
// tüm veriler deterministik olarak üretilir (Math.random KULLANILMAZ).
//
// Bu katman Envanter modülündeki gerçek ürün verisiyle (lib/mock/inventory.ts)
// çapraz referans kurar — kimyasal/ekipman sayıları burada TEKRAR ÜRETİLMEZ,
// doğrudan Envanter'den okunur. Pest Yönetimi; tür kataloğu, mevzuat/kullanım
// rehberi ve saha uygulama bilgisi sağlayan bir "domain referans" katmanıdır.

import type { RiskLevel } from "@/lib/mock/crm";
import { products, type Product } from "@/lib/mock/inventory";

export type PestCategory = "kemirgen" | "surunen_hasere" | "ucan_hasere" | "depo_zararlisi";
export type PestIconKey = "rodent" | "roach" | "ant" | "fly" | "mosquito" | "spider" | "wasp" | "beetle";
export type EquipmentCategory = "trap" | "bait" | "uv" | "pheromone";

export interface PestSpecies {
  id: string;
  name: string;
  scientificName: string;
  category: PestCategory;
  riskLevel: RiskLevel;
  activeSeason: string;
  description: string;
  controlMethod: string;
  icon: PestIconKey;
}

export interface EquipmentGuide {
  id: string;
  category: EquipmentCategory;
  title: string;
  description: string;
  usageNote: string;
  targetSpeciesIds: string[];
  relatedProductNameContains: string[];
}

export const PEST_CATEGORY_LABELS: Record<PestCategory, string> = {
  kemirgen: "Kemirgen",
  surunen_hasere: "Sürünen Haşere",
  ucan_hasere: "Uçan Haşere",
  depo_zararlisi: "Depo Zararlısı",
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  trap: "Tuzaklar",
  bait: "Yemler",
  uv: "UV Sistemleri",
  pheromone: "Feromonlar",
};

export const pestSpecies: PestSpecies[] = [
  {
    id: "pest-001",
    name: "Alman Hamamböceği",
    scientificName: "Blattella germanica",
    category: "surunen_hasere",
    riskLevel: "critical",
    activeSeason: "Yıl Boyu",
    description: "Sıcak, nemli ve gıda kaynağına yakın alanlarda (mutfak, gıda üretim hattı) hızla ürer.",
    controlMethod: "Jel yem istasyonu + kalıcı etkili sprey + hijyen sıkılaştırma.",
    icon: "roach",
  },
  {
    id: "pest-002",
    name: "Ev Faresi",
    scientificName: "Mus musculus",
    category: "kemirgen",
    riskLevel: "critical",
    activeSeason: "Yıl Boyu (Sonbahar-Kış yoğun)",
    description: "Bina dışından iç mekana kolayca giriş yapabilir, gıda ve ambalaj kontaminasyonuna yol açar.",
    controlMethod: "Dış çevre yem istasyonları + proofing (giriş noktası kapatma) + iz takibi.",
    icon: "rodent",
  },
  {
    id: "pest-003",
    name: "Norveç Sıçanı",
    scientificName: "Rattus norvegicus",
    category: "kemirgen",
    riskLevel: "high",
    activeSeason: "Yıl Boyu",
    description: "Kanalizasyon ve atık alanlarından bina çevresine ulaşır, yapısal hasara neden olabilir.",
    controlMethod: "Kapan istasyonu + dış çevre yem noktaları + atık alan yönetimi.",
    icon: "rodent",
  },
  {
    id: "pest-004",
    name: "Karasinek",
    scientificName: "Musca domestica",
    category: "ucan_hasere",
    riskLevel: "high",
    activeSeason: "İlkbahar - Sonbahar",
    description: "Atık ve organik madde üzerinde ürer, yüzeyden yüzeye patojen taşıyabilir.",
    controlMethod: "UV böcek tuzağı + atık alan hijyeni + kapı/pencere sineklik kontrolü.",
    icon: "fly",
  },
  {
    id: "pest-005",
    name: "Sivrisinek",
    scientificName: "Culex pipiens",
    category: "ucan_hasere",
    riskLevel: "medium",
    activeSeason: "Yaz Ayları",
    description: "Durgun su birikintilerinde üremesi nedeniyle dış mekan drenajı kritik önem taşır.",
    controlMethod: "Durgun su kaynağı eliminasyonu + larvasit uygulama + ULV sisleme.",
    icon: "mosquito",
  },
  {
    id: "pest-006",
    name: "Firavun Karıncası",
    scientificName: "Monomorium pharaonis",
    category: "surunen_hasere",
    riskLevel: "medium",
    activeSeason: "Yıl Boyu (iç mekan)",
    description: "Küçük koloniler halinde duvar boşluklarında yaşar, gıda alanlarına kolayca ulaşır.",
    controlMethod: "Jel yem + koloni takip + giriş noktası sızdırmazlığı.",
    icon: "ant",
  },
  {
    id: "pest-007",
    name: "Yaban Arısı",
    scientificName: "Vespula germanica",
    category: "ucan_hasere",
    riskLevel: "medium",
    activeSeason: "Yaz - Sonbahar",
    description: "Çatı altı ve dış cephe boşluklarında yuva kurar, personel/misafir güvenliği riski oluşturur.",
    controlMethod: "Yuva tespiti ve güvenli imha + dış cephe boşluk kapatma.",
    icon: "wasp",
  },
  {
    id: "pest-008",
    name: "Un Kurdu (Depo Böceği)",
    scientificName: "Tribolium confusum",
    category: "depo_zararlisi",
    riskLevel: "high",
    activeSeason: "Yıl Boyu (depo ortamı)",
    description: "Un, tahıl ve kuru gıda depolarında üreyerek stok kaybına ve kontaminasyona yol açar.",
    controlMethod: "Feromon tuzağı ile popülasyon izleme + rotasyonlu stok yönetimi + fumigasyon (gerektiğinde).",
    icon: "beetle",
  },
];

export function getSpeciesById(id: string): PestSpecies | undefined {
  return pestSpecies.find((s) => s.id === id);
}

export function getSpeciesByCategory(category: PestCategory): PestSpecies[] {
  return pestSpecies.filter((s) => s.category === category);
}

export const equipmentGuides: EquipmentGuide[] = [
  {
    id: "eq-001",
    category: "trap",
    title: "Yapışkan Tuzak Kartları",
    description: "Sürünen ve küçük uçan haşerelerin popülasyon yoğunluğunu izlemek için pasif tuzak.",
    usageNote: "Duvar diplerine, ekipman arkalarına ve gıda hattı çevresine 3-5 metre aralıklarla yerleştirilir; aylık değişim önerilir.",
    targetSpeciesIds: ["pest-001", "pest-006"],
    relatedProductNameContains: ["Yapışkan Tuzak"],
  },
  {
    id: "eq-002",
    category: "trap",
    title: "Kemirgen Kapan İstasyonu",
    description: "Dış çevre ve depo alanlarında kemirgen giriş noktalarını izlemek için kilitli kapan kutusu.",
    usageNote: "Bina çevresinde 10-15 metre aralıklarla, giriş noktalarına yakın konumlandırılır; haftalık kontrol edilir.",
    targetSpeciesIds: ["pest-002", "pest-003"],
    relatedProductNameContains: ["Kemirgen Yem İstasyonu", "Yem İstasyonu Anahtarı"],
  },
  {
    id: "eq-003",
    category: "bait",
    title: "Jel Yem Uygulaması",
    description: "Nokta atışı uygulanabilen, hamamböceği ve karınca kolonilerini kaynağında hedefleyen yem formu.",
    usageNote: "Aktivite izi görülen çatlak, boru geçişi ve ekipman altlarına küçük noktalar halinde uygulanır.",
    targetSpeciesIds: ["pest-001", "pest-006"],
    relatedProductNameContains: ["Goliath Gel", "Bromakil Pasta"],
  },
  {
    id: "eq-004",
    category: "bait",
    title: "Kemirgen Yem İstasyonu",
    description: "Dış çevrede güvenli, kilitli yem sunumu sağlayan istasyon sistemi.",
    usageNote: "Sadece dış çevrede kullanılır; iç mekanda mekanik kapan tercih edilir.",
    targetSpeciesIds: ["pest-002", "pest-003"],
    relatedProductNameContains: ["Bromakil Pasta", "Kemirgen Yem İstasyonu"],
  },
  {
    id: "eq-005",
    category: "uv",
    title: "UV Böcek Tuzağı Sistemi",
    description: "Uçan haşereleri UV ışıkla çekip yapışkan/elektrikli yüzeyle etkisiz hale getiren sistem.",
    usageNote: "Dış kapı girişlerinin karşısına, gıda hattından uzağa, yerden 1.8-2.2 metre yüksekliğe monte edilir.",
    targetSpeciesIds: ["pest-004"],
    relatedProductNameContains: ["UV Böcek Tuzağı"],
  },
  {
    id: "eq-006",
    category: "pheromone",
    title: "Depo Zararlısı Feromon Tuzağı",
    description: "Un kurdu gibi depo zararlılarının erken tespiti için cinsel feromon bazlı izleme tuzağı.",
    usageNote: "Depo raflarının üst seviyelerine, hava akışına yakın noktalara asılır; feromon kartuşu 8-10 haftada bir değiştirilir.",
    targetSpeciesIds: ["pest-008"],
    relatedProductNameContains: [],
  },
];

export function getEquipmentByCategory(category: EquipmentCategory): EquipmentGuide[] {
  return equipmentGuides.filter((g) => g.category === category);
}

export function getRelatedProducts(guide: EquipmentGuide): Product[] {
  if (guide.relatedProductNameContains.length === 0) return [];
  return products.filter((p) => guide.relatedProductNameContains.some((needle) => p.name.includes(needle)));
}

/** Bir ekipman kategorisine bağlı tüm Envanter ürünlerinin canlı stok özetini döndürür (gerçek veri, tekrar üretilmez). */
export function getEquipmentCategoryStockSummary(category: EquipmentCategory) {
  const guides = getEquipmentByCategory(category);
  const relatedProducts = guides.flatMap((g) => getRelatedProducts(g));
  const uniqueProducts = Array.from(new Map(relatedProducts.map((p) => [p.id, p])).values());
  const totalStock = uniqueProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const criticalCount = uniqueProducts.filter((p) => p.currentStock <= p.criticalLevel).length;
  return { products: uniqueProducts, totalStock, criticalCount };
}
