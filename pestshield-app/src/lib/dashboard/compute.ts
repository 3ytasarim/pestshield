import type {
  Customer as PrismaCustomer,
  Offer as PrismaOffer,
  ServiceOrder as PrismaServiceOrder,
  Station as PrismaStation,
  StationCheck as PrismaStationCheck,
  WorkOrder as PrismaWorkOrder,
  Technician as PrismaTechnician,
} from "@/generated/prisma/client";
import type {
  TodayServicesSummary,
  OpenJobsSummary,
  PendingOffersSummary,
  PendingCollectionsSummary,
  CriticalRisksSummary,
  AiRecommendation,
  ActivityItem,
  Appointment,
  PestActivityPoint,
  AuditReadiness,
} from "@/lib/mock/dashboard";

type WorkOrderWithRelations = PrismaWorkOrder & {
  customer: Pick<PrismaCustomer, "companyName"> | null;
  technician: Pick<PrismaTechnician, "name"> | null;
};
type StationCheckWithRelations = PrismaStationCheck & {
  technician: Pick<PrismaTechnician, "name"> | null;
  station: Pick<PrismaStation, "type" | "customerId"> & {
    customer: Pick<PrismaCustomer, "companyName">;
  };
};

const WORK_ORDER_STATUS_LABEL: Record<string, string> = {
  planned: "Planlandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  delayed: "Gecikti",
  cancelled: "İptal",
};

const STATION_TYPE_TO_PEST: Record<string, keyof Omit<PestActivityPoint, "week">> = {
  rodent_bait: "kemirgen",
  glue_trap: "hamamboceği",
  insect_trap: "karinca",
  uv_trap: "ucanHasere",
  pheromone_trap: "ucanHasere",
};

/** Yerel (sunucu saat dilimi) tarihi döner — toISOString() UTC kullandığından gece yarısına yakın saatlerde bir gün geriye kayabilir. */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr(): string {
  return toLocalDateStr(new Date());
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

export function computeTodayServices(workOrders: PrismaWorkOrder[]): TodayServicesSummary {
  const today = todayStr();
  const todays = workOrders.filter((o) => o.plannedDate === today);
  return {
    total: todays.length,
    completed: todays.filter((o) => o.status === "completed").length,
    pending: todays.filter((o) => o.status === "planned" || o.status === "in_progress").length,
    delayed: todays.filter((o) => o.status === "delayed").length,
  };
}

export function computeOpenJobs(
  workOrders: PrismaWorkOrder[],
  serviceOrders: Pick<PrismaServiceOrder, "approved">[],
): OpenJobsSummary {
  const today = todayStr();
  const open = workOrders.filter((o) => o.status === "planned" || o.status === "in_progress");
  return {
    active: open.length,
    highPriority: open.filter((o) => o.plannedDate < today).length,
    waitingApproval: serviceOrders.filter((o) => !o.approved).length,
    unassigned: open.filter((o) => !o.technicianId).length,
  };
}

export function computePendingOffers(
  offers: Pick<PrismaOffer, "status" | "amount" | "validUntil">[],
): PendingOffersSummary {
  const today = todayStr();
  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const inSevenDaysStr = toLocalDateStr(inSevenDays);

  const sent = offers.filter((o) => o.status === "sent");
  const decided = offers.filter((o) => o.status === "accepted" || o.status === "rejected" || o.status === "expired");
  const accepted = offers.filter((o) => o.status === "accepted");

  return {
    total: sent.length,
    value: sent.reduce((sum, o) => sum + Number(o.amount), 0),
    expiring: sent.filter((o) => o.validUntil >= today && o.validUntil <= inSevenDaysStr).length,
    conversionRate: decided.length === 0 ? 0 : Math.round((accepted.length / decided.length) * 100),
  };
}

/** Finans modülü henüz Postgres'e taşınmadı — gerçek tahsilat verisi olmadığından sıfır döner. */
export function computePendingCollections(): PendingCollectionsSummary {
  return { totalAmount: 0, overdueAmount: 0, dueThisWeek: 0, trend: [0, 0, 0, 0, 0, 0, 0] };
}

export function computeCriticalRisks(
  stations: Pick<PrismaStation, "nextCheckDue">[],
  stationChecks: Pick<PrismaStationCheck, "activityLevel" | "checkedAt" | "activityFound">[],
): CriticalRisksSummary {
  const today = todayStr();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = toLocalDateStr(thirtyDaysAgo);

  return {
    highPestActivity: stationChecks.filter(
      (c) => c.activityFound && (c.activityLevel === "medium" || c.activityLevel === "high") && c.checkedAt >= thirtyDaysAgoStr,
    ).length,
    overdueStationChecks: stations.filter((s) => s.nextCheckDue < today).length,
    // Denetim/Fotoğraf modülleri henüz taşınmadı — takip edilebilir veri yok.
    missingPhotos: 0,
    openCorrectiveActions: 0,
  };
}

export function computeAiRecommendations(
  risks: CriticalRisksSummary,
  offers: PendingOffersSummary,
): AiRecommendation[] {
  const recs: AiRecommendation[] = [];
  if (risks.highPestActivity > 0) {
    recs.push({
      id: "risk-pest",
      message: `${risks.highPestActivity} istasyonda son 30 günde yüksek/orta haşere aktivitesi tespit edildi.`,
    });
  }
  if (risks.overdueStationChecks > 0) {
    recs.push({
      id: "risk-overdue",
      message: `${risks.overdueStationChecks} istasyonda kontrol süresi geçmiş görünüyor.`,
    });
  }
  if (offers.expiring > 0) {
    recs.push({
      id: "offer-expiring",
      message: `${offers.expiring} teklifin geçerlilik süresi 7 gün içinde doluyor.`,
    });
  }
  if (recs.length === 0) {
    recs.push({ id: "all-clear", message: "Şu anda öne çıkan bir risk veya aksiyon bulunmuyor." });
  }
  return recs;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = daysBetween(new Date(), date);
  if (diff <= 0) return "Bugün";
  if (diff === 1) return "Dün";
  if (diff < 7) return `${diff} gün önce`;
  if (diff < 30) return `${Math.floor(diff / 7)} hafta önce`;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function computeRecentActivity(
  customers: Pick<PrismaCustomer, "id" | "companyName" | "createdAt">[],
  offers: (Pick<PrismaOffer, "createdAt" | "status"> & { customer: Pick<PrismaCustomer, "companyName"> })[],
  workOrders: WorkOrderWithRelations[],
  stationChecks: StationCheckWithRelations[],
): ActivityItem[] {
  const list: { date: Date; item: ActivityItem }[] = [];

  for (const c of customers) {
    list.push({
      date: c.createdAt,
      item: {
        id: `customer-${c.id}`,
        type: "customer_added",
        message: `${c.companyName} yeni müşteri olarak eklendi`,
        actor: "Sistem",
        timeAgo: formatTimeAgo(toLocalDateStr(c.createdAt)),
      },
    });
  }
  for (const o of offers.filter((x) => x.status === "sent")) {
    list.push({
      date: new Date(o.createdAt),
      item: {
        id: `offer-${o.createdAt}-${o.customer.companyName}`,
        type: "offer_sent",
        message: `${o.customer.companyName} için teklif gönderildi`,
        actor: "Sistem",
        timeAgo: formatTimeAgo(o.createdAt),
      },
    });
  }
  for (const wo of workOrders.filter((x) => x.status === "completed" && x.completedDate)) {
    list.push({
      date: new Date(wo.completedDate as string),
      item: {
        id: `wo-${wo.id}`,
        type: "service_completed",
        message: `${wo.customer?.companyName ?? "Müşteri"} için servis tamamlandı`,
        actor: wo.technician?.name ?? "Sistem",
        timeAgo: formatTimeAgo(wo.completedDate as string),
      },
    });
  }
  for (const sc of stationChecks) {
    list.push({
      date: new Date(sc.checkedAt),
      item: {
        id: `check-${sc.id}`,
        type: "station_checked",
        message: `${sc.station.customer.companyName} - istasyon kontrol edildi`,
        actor: sc.technician?.name ?? "Sistem",
        timeAgo: formatTimeAgo(sc.checkedAt),
      },
    });
  }
  return list
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6)
    .map((e) => e.item);
}

export function computeAppointments(workOrders: WorkOrderWithRelations[]): {
  today: Appointment[];
  upcoming: Appointment[];
} {
  const today = todayStr();
  const toAppointment = (o: WorkOrderWithRelations, timeSlot: string): Appointment => ({
    id: o.id,
    customerName: o.customer?.companyName ?? "Müşteri",
    technicianName: o.technician?.name ?? "Atanmamış",
    timeSlot,
    serviceType: o.serviceType,
  });

  const todayList = workOrders
    .filter((o) => o.plannedDate === today && o.status !== "cancelled")
    .map((o) => toAppointment(o, WORK_ORDER_STATUS_LABEL[o.status] ?? o.status));

  const upcomingList = workOrders
    .filter((o) => o.plannedDate > today && (o.status === "planned" || o.status === "in_progress"))
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))
    .slice(0, 5)
    .map((o) =>
      toAppointment(
        o,
        new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(o.plannedDate)),
      ),
    );

  return { today: todayList, upcoming: upcomingList };
}

export function computePestActivityTrend(stationChecks: StationCheckWithRelations[]): PestActivityPoint[] {
  const weeks: PestActivityPoint[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7 - 6);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const point: PestActivityPoint = {
      week: `${8 - i}. Hafta`,
      kemirgen: 0,
      hamamboceği: 0,
      ucanHasere: 0,
      karinca: 0,
    };
    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);
    for (const c of stationChecks) {
      if (!c.activityFound || c.checkedAt < startStr || c.checkedAt > endStr) continue;
      const category = STATION_TYPE_TO_PEST[c.station.type];
      if (category) point[category] += 1;
    }
    weeks.push(point);
  }
  return weeks;
}

export function computeAuditReadiness(
  stations: Pick<PrismaStation, "nextCheckDue">[],
  workOrders: Pick<PrismaWorkOrder, "status" | "hasReport">[],
  openCorrectiveActionCount: number,
): AuditReadiness {
  const today = todayStr();
  const stationsUpToDate = stations.length > 0 && stations.every((s) => s.nextCheckDue >= today);
  const completedOrders = workOrders.filter((o) => o.status === "completed");
  const reportsComplete = completedOrders.length > 0 && completedOrders.every((o) => o.hasReport);

  const checklist = [
    { id: "chk-1", label: "Servis raporları tamamlandı", done: reportsComplete },
    { id: "chk-2", label: "İstasyon kontrolleri güncel", done: stationsUpToDate },
    { id: "chk-3", label: "Eksik fotoğraf bulunuyor (henüz izlenmiyor)", done: false },
    { id: "chk-4", label: "Açık düzeltici faaliyet yok", done: openCorrectiveActionCount === 0 },
  ];
  const score = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);
  return { score, checklist };
}
