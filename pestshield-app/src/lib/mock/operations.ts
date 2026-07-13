// PestShield Operasyon mock veri katmanı. Gerçek backend henüz bağlanmadı;
// tüm veriler deterministik olarak üretilir (Math.random KULLANILMAZ).
//
// İstasyonlar CRM'deki gerçek Location kayıtlarının `stationCount` alanına göre
// üretilir — bu sayede Lokasyonlar sayfasında görünen istasyon sayısı ile burada
// üretilen istasyon kayıtları asla çelişmez (tek doğruluk kaynağı: Location.stationCount).

import { customers, getLocations, type Customer, type Location } from "@/lib/mock/crm";
import { warehouses } from "@/lib/mock/inventory";

export type StationType = "rodent_bait" | "insect_trap" | "glue_trap" | "uv_trap" | "pheromone_trap";
export type StationStatus = "active" | "needs_attention" | "inactive";
export type ActivityLevel = "none" | "low" | "medium" | "high";

export interface Station {
  id: string;
  qrCode: string;
  customerId: string;
  locationId: string;
  label: string;
  type: StationType;
  status: StationStatus;
  installedDate: string;
  lastCheckDate: string | null;
  nextCheckDue: string;
}

export interface StationCheck {
  id: string;
  stationId: string;
  technicianName: string;
  checkedAt: string;
  activityFound: boolean;
  activityLevel: ActivityLevel;
  actionTaken: string;
  note: string;
}

export type TechnicianStatus = "active" | "on_leave" | "inactive";

export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: TechnicianStatus;
  vehicleId: string | null;
}

export type VehicleStatus = "active" | "maintenance" | "inactive";

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  assignedTechnicianId: string | null;
  warehouseId: string | null;
  registrationNumber: string;
  registrationExpiry: string;
  inspectionDue: string;
  insuranceDue: string;
  status: VehicleStatus;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  frequency: string;
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function pad(n: number, len = 3): string {
  return String(n).padStart(len, "0");
}

const SERVICE_PERIOD_DAYS: Record<string, number> = {
  Haftalık: 7,
  "2 Haftada Bir": 14,
  Aylık: 30,
  "3 Aylık": 90,
};

const LOCATION_STATION_TYPE: Record<Location["type"], StationType> = {
  production_area: "insect_trap",
  warehouse: "rodent_bait",
  cafeteria: "glue_trap",
  office: "glue_trap",
  garden: "rodent_bait",
  waste_area: "rodent_bait",
  loading_area: "uv_trap",
  raw_material_warehouse: "rodent_bait",
  finished_goods_warehouse: "pheromone_trap",
};

const TECHNICIAN_NAMES = ["Ahmet Yılmaz", "Mehmet Kaya", "Elif Demir"];

function buildStations(): { stations: Station[]; checks: StationCheck[] } {
  const stations: Station[] = [];
  const checks: StationCheck[] = [];
  let globalSeq = 0;

  customers.forEach((customer, cIndex) => {
    const locations = getLocations(customer.id);
    const periodDays = SERVICE_PERIOD_DAYS[customer.servicePeriod] ?? 30;

    locations.forEach((location, lIndex) => {
      for (let i = 0; i < location.stationCount; i++) {
        globalSeq += 1;
        const stationType = LOCATION_STATION_TYPE[location.type];
        const seed = (cIndex * 13 + lIndex * 7 + i * 3) % 10;
        const status: StationStatus = seed === 9 ? "needs_attention" : seed === 8 ? "inactive" : "active";
        const lastCheckOffset = -((seed % 5) * 4 + 2);
        const lastCheckDate = daysFromNow(lastCheckOffset);
        const nextCheckDue = daysFromNow(lastCheckOffset + periodDays);
        const installedOffset = -(180 + cIndex * 20 + lIndex * 5);

        const station: Station = {
          id: `stn-${pad(globalSeq, 4)}`,
          qrCode: `PS-STN-${pad(globalSeq, 6)}`,
          customerId: customer.id,
          locationId: location.id,
          label: `${location.name} — İstasyon ${i + 1}`,
          type: stationType,
          status,
          installedDate: daysFromNow(installedOffset),
          lastCheckDate,
          nextCheckDue,
        };
        stations.push(station);

        // Her istasyon için deterministik 1-2 geçmiş kontrol kaydı.
        const technician = TECHNICIAN_NAMES[(cIndex + lIndex + i) % TECHNICIAN_NAMES.length];
        const activityFound = status === "needs_attention" || seed === 7;
        const activityLevel: ActivityLevel = status === "needs_attention" ? "high" : activityFound ? "medium" : "none";
        checks.push({
          id: `chk-${pad(globalSeq, 4)}-1`,
          stationId: station.id,
          technicianName: technician,
          checkedAt: lastCheckDate,
          activityFound,
          activityLevel,
          actionTaken: activityFound ? "Yem/tuzak yenilendi" : "Kontrol edildi, aktivite yok",
          note: activityFound ? "Bir sonraki ziyarette yakın takip önerilir." : "",
        });
        if (seed % 4 === 0) {
          checks.push({
            id: `chk-${pad(globalSeq, 4)}-0`,
            stationId: station.id,
            technicianName: technician,
            checkedAt: daysFromNow(lastCheckOffset - periodDays),
            activityFound: false,
            activityLevel: "none",
            actionTaken: "Rutin kontrol",
            note: "",
          });
        }
      }
    });
  });

  return { stations, checks };
}

const built = buildStations();
export const stations: Station[] = built.stations;
export const stationChecks: StationCheck[] = built.checks;

export function getStationsForCustomer(customerId: string): Station[] {
  return stations.filter((s) => s.customerId === customerId);
}

export function getStationsForLocation(locationId: string): Station[] {
  return stations.filter((s) => s.locationId === locationId);
}

export function getStationById(id: string): Station | undefined {
  return stations.find((s) => s.id === id);
}

export function getStationByQrCode(qrCode: string): Station | undefined {
  return stations.find((s) => s.qrCode === qrCode);
}

export function getChecksForStation(stationId: string): StationCheck[] {
  return stationChecks.filter((c) => c.stationId === stationId).sort((a, b) => (a.checkedAt < b.checkedAt ? 1 : -1));
}

export function isStationOverdue(station: Station): boolean {
  return new Date(station.nextCheckDue).getTime() < Date.now();
}

export function getOverdueStations(): Station[] {
  return stations.filter(isStationOverdue);
}

// ---------------------------------------------------------------------------
// Teknisyenler
// ---------------------------------------------------------------------------

export const technicians: Technician[] = [
  {
    id: "tech-001",
    name: "Ahmet Yılmaz",
    phone: "0532 100 10 20",
    email: "ahmet.yilmaz@pestshield.app",
    licenseNumber: "BS-2024-00112",
    licenseExpiry: daysFromNow(45),
    status: "active",
    vehicleId: "veh-001",
  },
  {
    id: "tech-002",
    name: "Mehmet Kaya",
    phone: "0532 200 20 30",
    email: "mehmet.kaya@pestshield.app",
    licenseNumber: "BS-2023-00087",
    licenseExpiry: daysFromNow(45),
    status: "active",
    vehicleId: "veh-002",
  },
  {
    id: "tech-003",
    name: "Elif Demir",
    phone: "0532 300 40 50",
    email: "elif.demir@pestshield.app",
    licenseNumber: "BS-2022-00045",
    licenseExpiry: daysFromNow(200),
    status: "active",
    vehicleId: "veh-003",
  },
  {
    id: "tech-004",
    name: "Canan Öztürk",
    phone: "0532 400 50 60",
    email: "canan.ozturk@pestshield.app",
    licenseNumber: "BS-2025-00201",
    licenseExpiry: daysFromNow(320),
    status: "on_leave",
    vehicleId: null,
  },
];

export function getTechnicianById(id: string): Technician | undefined {
  return technicians.find((t) => t.id === id);
}

export function isLicenseExpiringSoon(technician: Technician): boolean {
  const days = Math.round((new Date(technician.licenseExpiry).getTime() - Date.now()) / 86_400_000);
  return days <= 60 && days >= 0;
}

// ---------------------------------------------------------------------------
// Araçlar
// ---------------------------------------------------------------------------

export const vehicles: Vehicle[] = [
  {
    id: "veh-001",
    plate: "34 PS 101",
    brand: "Ford",
    model: "Transit Courier",
    assignedTechnicianId: "tech-001",
    warehouseId: "wh-002",
    registrationNumber: "AB-123456",
    registrationExpiry: daysFromNow(400),
    inspectionDue: daysFromNow(90),
    insuranceDue: daysFromNow(210),
    status: "active",
  },
  {
    id: "veh-002",
    plate: "41 PS 102",
    brand: "Fiat",
    model: "Doblo",
    assignedTechnicianId: "tech-002",
    warehouseId: "wh-003",
    registrationNumber: "AB-234567",
    registrationExpiry: daysFromNow(25),
    inspectionDue: daysFromNow(18),
    insuranceDue: daysFromNow(150),
    status: "active",
  },
  {
    id: "veh-003",
    plate: "35 PS 103",
    brand: "Renault",
    model: "Kangoo",
    assignedTechnicianId: "tech-003",
    warehouseId: "wh-005",
    registrationNumber: "AB-345678",
    registrationExpiry: daysFromNow(260),
    inspectionDue: daysFromNow(260),
    insuranceDue: daysFromNow(40),
    status: "active",
  },
  {
    id: "veh-004",
    plate: "06 PS 104",
    brand: "Ford",
    model: "Transit Courier",
    assignedTechnicianId: null,
    warehouseId: null,
    registrationNumber: "AB-456789",
    registrationExpiry: daysFromNow(300),
    inspectionDue: daysFromNow(300),
    insuranceDue: daysFromNow(300),
    status: "maintenance",
  },
];

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((v) => v.id === id);
}

export function getWarehouseForVehicle(vehicle: Vehicle) {
  return vehicle.warehouseId ? warehouses.find((w) => w.id === vehicle.warehouseId) : undefined;
}

export function isVehicleDueSoon(vehicle: Vehicle): boolean {
  const dueSoon = (dateStr: string) => {
    const days = Math.round((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
    return days <= 30 && days >= 0;
  };
  return dueSoon(vehicle.inspectionDue) || dueSoon(vehicle.insuranceDue) || dueSoon(vehicle.registrationExpiry);
}

// ---------------------------------------------------------------------------
// Kontrol Noktaları — servis ziyaretlerinde kullanılan tekrarlayan denetim
// checklist şablonları. Denetim modülündeki sertifikasyon checklist'lerinden
// (HACCP/BRCGS/ISO/FSSC) farklıdır: bu liste her rutin serviste teknisyenin
// gözden geçirdiği operasyonel kontrol maddeleridir.
// ---------------------------------------------------------------------------

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: "cpt-001",
    title: "Dış cephe giriş noktaları kontrolü",
    category: "Yapısal",
    description: "Kapı altı, boru geçişi ve kablo kanallarında yeni açıklık oluşup oluşmadığını kontrol et.",
    frequency: "Her ziyarette",
  },
  {
    id: "cpt-002",
    title: "Atık alanı hijyen kontrolü",
    category: "Hijyen",
    description: "Atık konteynerlerinin kapalı ve temiz olduğunu, taşma olmadığını doğrula.",
    frequency: "Her ziyarette",
  },
  {
    id: "cpt-003",
    title: "UV tuzak lamba/yapışkan durumu",
    category: "Ekipman",
    description: "UV lambaların çalıştığını ve yapışkan yüzeylerin dolmadığını kontrol et.",
    frequency: "Aylık",
  },
  {
    id: "cpt-004",
    title: "Kemirgen istasyonu kilit/etiket kontrolü",
    category: "Ekipman",
    description: "İstasyonların kilitli ve QR etiketlerinin okunur durumda olduğunu doğrula.",
    frequency: "Her ziyarette",
  },
  {
    id: "cpt-005",
    title: "Depo raf düzeni ve rotasyon kontrolü",
    category: "Hijyen",
    description: "Hammadde/mamul depolarında FIFO rotasyonu ve zemin temizliğini gözden geçir.",
    frequency: "Aylık",
  },
  {
    id: "cpt-006",
    title: "Personel farkındalık kontrolü",
    category: "Eğitim",
    description: "Saha personelinin haşere belirtisi bildirim sürecini bildiğini teyit et.",
    frequency: "3 Aylık",
  },
];
