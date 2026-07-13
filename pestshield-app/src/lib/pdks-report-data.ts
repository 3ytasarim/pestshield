// PDKS (Personel Devam Kontrol Sistemi) raporu için mesai kayıtlarını
// TechnicianWorkday verisinden okunabilir satırlara dönüştürür.

import { routeDistanceKm, technicianWorkdays, type TechnicianWorkday, type WorkdayStatus } from "@/lib/mock/tracking";

export interface PdksRow {
  workdayId: string;
  technicianName: string;
  date: string;
  status: WorkdayStatus;
  statusLabel: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  stopCount: number;
  distanceKm: number;
}

const STATUS_LABELS: Record<WorkdayStatus, string> = {
  not_started: "Başlamadı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
};

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function toRow(w: TechnicianWorkday): PdksRow {
  const durationMinutes =
    w.startedAt && w.endedAt ? Math.round((new Date(w.endedAt).getTime() - new Date(w.startedAt).getTime()) / 60_000) : null;
  return {
    workdayId: w.id,
    technicianName: w.technicianName,
    date: w.date,
    status: w.status,
    statusLabel: STATUS_LABELS[w.status],
    startTime: formatTime(w.startedAt),
    endTime: formatTime(w.endedAt),
    durationMinutes,
    stopCount: w.stops.filter((s) => s.customerId).length,
    distanceKm: routeDistanceKm(w.breadcrumbs),
  };
}

export function getPdksRows(options: { technicianName?: string | null; startDate?: string; endDate?: string } = {}): PdksRow[] {
  const { technicianName, startDate, endDate } = options;
  return technicianWorkdays
    .filter((w) => !technicianName || w.technicianName === technicianName)
    .filter((w) => !startDate || w.date >= startDate)
    .filter((w) => !endDate || w.date <= endDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(toRow);
}
