export interface TodayServicesSummary {
  total: number;
  completed: number;
  pending: number;
  delayed: number;
}

export interface OpenJobsSummary {
  active: number;
  highPriority: number;
  waitingApproval: number;
  unassigned: number;
}

export interface PendingOffersSummary {
  total: number;
  value: number;
  expiring: number;
  conversionRate: number;
}

export interface PendingCollectionsSummary {
  totalAmount: number;
  overdueAmount: number;
  dueThisWeek: number;
  trend: number[];
}

export interface CriticalRisksSummary {
  highPestActivity: number;
  overdueStationChecks: number;
  missingPhotos: number;
  openCorrectiveActions: number;
}

export interface AiRecommendation {
  id: string;
  message: string;
}

export type ActivityType =
  | "service_completed"
  | "customer_added"
  | "offer_sent"
  | "payment_received"
  | "station_checked"
  | "corrective_action_opened";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  actor: string;
  timeAgo: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  technicianName: string;
  timeSlot: string;
  serviceType: string;
}

export interface PestActivityPoint {
  week: string;
  kemirgen: number;
  hamamboceği: number;
  ucanHasere: number;
  karinca: number;
}

export interface AuditChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface AuditReadiness {
  score: number;
  checklist: AuditChecklistItem[];
}

export function auditStatusText(score: number): string {
  if (score >= 80) return "Denetime Hazır";
  if (score >= 50) return "İyileştirme Gerekli";
  return "Kritik Eksikler Var";
}
