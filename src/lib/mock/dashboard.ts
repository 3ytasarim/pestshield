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

export const todayServices: TodayServicesSummary = {
  total: 18,
  completed: 11,
  pending: 5,
  delayed: 2,
};

export const openJobs: OpenJobsSummary = {
  active: 27,
  highPriority: 4,
  waitingApproval: 6,
  unassigned: 3,
};

export const pendingOffers: PendingOffersSummary = {
  total: 9,
  value: 184500,
  expiring: 3,
  conversionRate: 42,
};

export const pendingCollections: PendingCollectionsSummary = {
  totalAmount: 312800,
  overdueAmount: 48250,
  dueThisWeek: 96400,
  trend: [62, 71, 58, 80, 74, 90, 83],
};

export const criticalRisks: CriticalRisksSummary = {
  highPestActivity: 3,
  overdueStationChecks: 2,
  missingPhotos: 1,
  openCorrectiveActions: 4,
};

export const aiRecommendations: AiRecommendation[] = [
  { id: "ai-1", message: "3 müşteride kemirgen aktivitesi artış eğiliminde." },
  { id: "ai-2", message: "2 istasyonda kontrol süresi geçmiş görünüyor." },
  { id: "ai-3", message: "1 müşteride denetim öncesi eksik rapor bulunuyor." },
  { id: "ai-4", message: "Bu hafta yağış nedeniyle haşere aktivitesi artabilir." },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "act-1",
    type: "service_completed",
    message: "Zeytin Restoran için servis tamamlandı",
    actor: "Ahmet Yılmaz",
    timeAgo: "12 dakika önce",
  },
  {
    id: "act-2",
    type: "customer_added",
    message: "Marmara Lojistik yeni müşteri olarak eklendi",
    actor: "Sistem",
    timeAgo: "38 dakika önce",
  },
  {
    id: "act-3",
    type: "offer_sent",
    message: "Palmiye AVM için teklif gönderildi",
    actor: "Elif Demir",
    timeAgo: "1 saat önce",
  },
  {
    id: "act-4",
    type: "payment_received",
    message: "Boğaziçi Otel tahsilatı alındı (18.400 ₺)",
    actor: "Muhasebe",
    timeAgo: "2 saat önce",
  },
  {
    id: "act-5",
    type: "station_checked",
    message: "Liman Depo - 14 istasyon kontrol edildi",
    actor: "Mehmet Kaya",
    timeAgo: "3 saat önce",
  },
  {
    id: "act-6",
    type: "corrective_action_opened",
    message: "Fırın Şubesi'nde düzeltici faaliyet açıldı",
    actor: "Elif Demir",
    timeAgo: "5 saat önce",
  },
];

export const todayAppointments: Appointment[] = [
  {
    id: "apt-1",
    customerName: "Zeytin Restoran",
    technicianName: "Ahmet Yılmaz",
    timeSlot: "09:00",
    serviceType: "Rutin Kontrol",
  },
  {
    id: "apt-2",
    customerName: "Marmara Lojistik",
    technicianName: "Mehmet Kaya",
    timeSlot: "11:30",
    serviceType: "İlk Uygulama",
  },
  {
    id: "apt-3",
    customerName: "Palmiye AVM",
    technicianName: "Elif Demir",
    timeSlot: "13:00",
    serviceType: "Denetim Hazırlığı",
  },
  {
    id: "apt-4",
    customerName: "Boğaziçi Otel",
    technicianName: "Ahmet Yılmaz",
    timeSlot: "15:30",
    serviceType: "Kemirgen Kontrolü",
  },
];

export const upcomingAppointments: Appointment[] = [
  {
    id: "apt-5",
    customerName: "Liman Depo",
    technicianName: "Mehmet Kaya",
    timeSlot: "Yarın 09:00",
    serviceType: "Rutin Kontrol",
  },
  {
    id: "apt-6",
    customerName: "Fırın Şubesi",
    technicianName: "Elif Demir",
    timeSlot: "Yarın 14:00",
    serviceType: "Düzeltici Faaliyet Takibi",
  },
];

export const pestActivityTrend: PestActivityPoint[] = [
  { week: "1. Hafta", kemirgen: 12, hamamboceği: 8, ucanHasere: 5, karinca: 10 },
  { week: "2. Hafta", kemirgen: 14, hamamboceği: 9, ucanHasere: 6, karinca: 11 },
  { week: "3. Hafta", kemirgen: 11, hamamboceği: 11, ucanHasere: 8, karinca: 9 },
  { week: "4. Hafta", kemirgen: 16, hamamboceği: 10, ucanHasere: 9, karinca: 13 },
  { week: "5. Hafta", kemirgen: 18, hamamboceği: 13, ucanHasere: 7, karinca: 12 },
  { week: "6. Hafta", kemirgen: 15, hamamboceği: 12, ucanHasere: 11, karinca: 15 },
  { week: "7. Hafta", kemirgen: 20, hamamboceği: 14, ucanHasere: 10, karinca: 14 },
  { week: "8. Hafta", kemirgen: 19, hamamboceği: 12, ucanHasere: 12, karinca: 16 },
];

export const auditReadiness: AuditReadiness = {
  score: 86,
  checklist: [
    { id: "chk-1", label: "Servis raporları tamamlandı", done: true },
    { id: "chk-2", label: "İstasyon kontrolleri güncel", done: true },
    { id: "chk-3", label: "Eksik fotoğraf bulunuyor", done: false },
    { id: "chk-4", label: "Açık düzeltici faaliyet var", done: false },
  ],
};

export function auditStatusText(score: number): string {
  if (score >= 80) return "Denetime Hazır";
  if (score >= 50) return "İyileştirme Gerekli";
  return "Kritik Eksikler Var";
}
