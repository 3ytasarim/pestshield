import type { StationStatus, StationType, TechnicianStatus, VehicleStatus, ActivityLevel } from "@/lib/mock/operations";

export const STATION_TYPE_LABELS: Record<StationType, string> = {
  rodent_bait: "Kemirgen Yem İstasyonu",
  insect_trap: "Haşere Tuzağı",
  glue_trap: "Yapışkan Tuzak",
  uv_trap: "UV Böcek Tuzağı",
  pheromone_trap: "Feromon Tuzağı",
};

export const STATION_STATUS_LABELS: Record<StationStatus, string> = {
  active: "Aktif",
  needs_attention: "İlgi Gerekiyor",
  inactive: "Pasif",
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  none: "Aktivite Yok",
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

export const TECHNICIAN_STATUS_LABELS: Record<TechnicianStatus, string> = {
  active: "Aktif",
  on_leave: "İzinli",
  inactive: "Pasif",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  active: "Aktif",
  maintenance: "Bakımda",
  inactive: "Pasif",
};
