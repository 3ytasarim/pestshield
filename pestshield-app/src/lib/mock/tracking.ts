// PestShield Rota Takibi mock veri katmanı.
//
// ÖNEMLİ — bu veri SİMÜLE EDİLMİŞTİR: gerçek bir telefondan konum verisi almıyoruz.
// Üretimde bu modül şu şekilde çalışacaktır: teknisyen mobil modülünde "İşe Başla"
// dediğinde tarayıcı/uygulama `navigator.geolocation.watchPosition` (veya native GPS)
// ile ~5 saniyede bir konum okur, bu ping'ler bir backend endpoint'ine POST edilir ve
// bu sayfa o kayıtları canlı çeker. Şu an backend/mobil izin altyapısı bu ortamda
// bulunmadığından, aynı veri şeklini deterministik olarak üretiyoruz — arayüz ve
// harita entegrasyonu gerçek veriyle birebir aynı şekilde çalışmaya hazırdır.

export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export type WorkdayStatus = "not_started" | "in_progress" | "completed";

export interface RouteStop {
  id: string;
  label: string;
  customerId: string | null;
  lat: number;
  lng: number;
  arrivedAt: string | null;
  departedAt: string | null;
  workOrderNo: string | null;
}

export interface TechnicianWorkday {
  id: string;
  technicianName: string;
  date: string;
  status: WorkdayStatus;
  startedAt: string | null;
  endedAt: string | null;
  stops: RouteStop[];
  breadcrumbs: GeoPoint[];
}

function todayAt(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgoAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** İki nokta arasında, hafif bir sokak-kıvrımı hissi veren deterministik ara noktalar üretir. */
function interpolateSegment(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  startTime: Date,
  endTime: Date,
  pointCount: number,
): GeoPoint[] {
  const points: GeoPoint[] = [];
  const totalMs = endTime.getTime() - startTime.getTime();
  for (let i = 0; i <= pointCount; i++) {
    const t = i / pointCount;
    const wiggle = Math.sin(t * Math.PI * 3) * 0.0012 * (1 - Math.abs(t - 0.5) * 1.6);
    points.push({
      lat: from.lat + (to.lat - from.lat) * t + wiggle,
      lng: from.lng + (to.lng - from.lng) * t - wiggle * 0.6,
      timestamp: new Date(startTime.getTime() + totalMs * t).toISOString(),
    });
  }
  return points;
}

function buildRoute(stops: RouteStop[]): GeoPoint[] {
  const breadcrumbs: GeoPoint[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const segStart = new Date(from.departedAt ?? from.arrivedAt!);
    const segEnd = new Date(to.arrivedAt ?? to.departedAt!);
    const segment = interpolateSegment(from, to, segStart, segEnd, 14);
    breadcrumbs.push(...(i === 0 ? segment : segment.slice(1)));
  }
  return breadcrumbs;
}

// ---------------------------------------------------------------------------
// Ahmet Yılmaz — bugün, tamamlanmış rota (Tuzla / Kartal / Ümraniye bölgesi)
// ---------------------------------------------------------------------------

const ahmetStops: RouteStop[] = [
  {
    id: "stop-1",
    label: "PestShield Ana Depo",
    customerId: null,
    lat: 40.8237,
    lng: 29.2987,
    arrivedAt: null,
    departedAt: todayAt(8, 0),
    workOrderNo: null,
  },
  {
    id: "stop-2",
    label: "Pakiş İlaçlama Hizmetleri",
    customerId: "cust-001",
    lat: 40.8156,
    lng: 29.3244,
    arrivedAt: todayAt(8, 24),
    departedAt: todayAt(9, 10),
    workOrderNo: "IS-2026-00101",
  },
  {
    id: "stop-3",
    label: "Tuzla Lojistik Merkezi",
    customerId: "cust-003",
    lat: 40.9046,
    lng: 29.1873,
    arrivedAt: todayAt(9, 48),
    departedAt: todayAt(10, 35),
    workOrderNo: "IS-2026-00301",
  },
  {
    id: "stop-4",
    label: "Ek Kontrol Noktası — Ümraniye",
    customerId: null,
    lat: 41.0165,
    lng: 29.1244,
    arrivedAt: todayAt(11, 15),
    departedAt: todayAt(11, 55),
    workOrderNo: null,
  },
  {
    id: "stop-5",
    label: "PestShield Ana Depo",
    customerId: null,
    lat: 40.8237,
    lng: 29.2987,
    arrivedAt: todayAt(12, 30),
    departedAt: null,
    workOrderNo: null,
  },
];

const ahmetWorkday: TechnicianWorkday = {
  id: "wd-ahmet-today",
  technicianName: "Ahmet Yılmaz",
  date: new Date().toISOString().slice(0, 10),
  status: "completed",
  startedAt: ahmetStops[0].departedAt,
  endedAt: ahmetStops[ahmetStops.length - 1].arrivedAt,
  stops: ahmetStops,
  breadcrumbs: buildRoute(ahmetStops),
};

// ---------------------------------------------------------------------------
// Mehmet Kaya — dün, tamamlanmış rota (Kocaeli / İzmit bölgesi)
// ---------------------------------------------------------------------------

const mehmetStops: RouteStop[] = [
  {
    id: "m-stop-1",
    label: "PestShield Ana Depo",
    customerId: null,
    lat: 40.8237,
    lng: 29.2987,
    arrivedAt: null,
    departedAt: daysAgoAt(1, 8, 15),
    workOrderNo: null,
  },
  {
    id: "m-stop-2",
    label: "Marmara Gıda Üretim A.Ş.",
    customerId: "cust-002",
    lat: 40.7654,
    lng: 29.9408,
    arrivedAt: daysAgoAt(1, 9, 10),
    departedAt: daysAgoAt(1, 10, 20),
    workOrderNo: "IS-2026-00201",
  },
  {
    id: "m-stop-3",
    label: "PestShield Ana Depo",
    customerId: null,
    lat: 40.8237,
    lng: 29.2987,
    arrivedAt: daysAgoAt(1, 11, 15),
    departedAt: null,
    workOrderNo: null,
  },
];

const mehmetWorkday: TechnicianWorkday = {
  id: "wd-mehmet-yesterday",
  technicianName: "Mehmet Kaya",
  date: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
  status: "completed",
  startedAt: mehmetStops[0].departedAt,
  endedAt: mehmetStops[mehmetStops.length - 1].arrivedAt,
  stops: mehmetStops,
  breadcrumbs: buildRoute(mehmetStops),
};

// ---------------------------------------------------------------------------
// Elif Demir — bugün, henüz başlamamış
// ---------------------------------------------------------------------------

const elifWorkday: TechnicianWorkday = {
  id: "wd-elif-today",
  technicianName: "Elif Demir",
  date: new Date().toISOString().slice(0, 10),
  status: "not_started",
  startedAt: null,
  endedAt: null,
  stops: [],
  breadcrumbs: [],
};

export const technicianWorkdays: TechnicianWorkday[] = [ahmetWorkday, mehmetWorkday, elifWorkday];

export function getWorkdayById(id: string): TechnicianWorkday | undefined {
  return technicianWorkdays.find((w) => w.id === id);
}

export function getLatestWorkdayForTechnician(name: string): TechnicianWorkday | undefined {
  return [...technicianWorkdays].reverse().find((w) => w.technicianName === name);
}

/** İki nokta arası kuş uçuşu mesafe (km) — haversine formülü. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

export function routeDistanceKm(breadcrumbs: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < breadcrumbs.length; i++) {
    total += haversineKm(breadcrumbs[i - 1], breadcrumbs[i]);
  }
  return Math.round(total * 10) / 10;
}
