import type {
  Customer as PrismaCustomer,
  Offer as PrismaOffer,
  PeriyotOccurrence as PrismaPeriyotOccurrence,
  ServiceOrder as PrismaServiceOrder,
  StationInspection as PrismaStationInspection,
  WorkOrder as PrismaWorkOrder,
  Technician as PrismaTechnician,
} from "@/generated/prisma";
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

const WORK_ORDER_STATUS_LABEL: Record<string, string> = {
  planned: "Planlandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  delayed: "Gecikti",
  cancelled: "İptal",
};

type StationInspectionWithOccurrence = Pick<
  PrismaStationInspection,
  "stationType" | "tuketim" | "hareket" | "tur1" | "tur2" | "sayim" | "periyotOccurrenceId"
> & {
  periyotOccurrence: { periodDate: string; personnelName: string; customer: { companyName: string } };
};

/** "Tamamlandı" — Ek-1 formu doldurulmuş mu (bkz. GET /api/crm/periyot/occurrences'ta
 * kullanılan aynı `hasEk1Form = !!ek1Form` sinyali, burada da AYNI tanım kullanılıyor). */
type PeriyotOccurrenceWithEk1 = Pick<PrismaPeriyotOccurrence, "periodDate"> & {
  ek1Form: { id: string } | null;
};

/** Bir istasyon denetimi kaydından, "Haşere Aktivite Trendi" grafiğinin dört kategorisinden
 * hangisine (varsa) sayılacağını çıkarır — sabit seçim listeli alanlara (bkz.
 * istasyon-inspection-constants.ts) dayanır, serbest metin yorumlamaya gerek yoktur:
 *  - zehirli (yemli kemirgen istasyonu): "Yem Tüketimi Var" → kemirgen
 *  - zehirsiz (kemirgen/diğer haşere izleme): "Hareket Var" + tür alanına göre kemirgen/hamamböceği/karınca
 *  - ic_uckun/dis_uckun (uçkun tuzağı): sayım > 0 → uçan haşere
 * "İstasyon Kırık / Kayıp" gibi arıza durumları veya bakım işlemleri (bant/floresan değişimi)
 * aktivite olarak sayılmaz. */
function classifyStationInspectionActivity(
  insp: Pick<PrismaStationInspection, "stationType" | "tuketim" | "hareket" | "tur1" | "tur2" | "sayim">,
): keyof Omit<PestActivityPoint, "week"> | null {
  switch (insp.stationType) {
    case "zehirli":
      return insp.tuketim === "Yem Tüketimi Var" ? "kemirgen" : null;
    case "zehirsiz": {
      if (insp.hareket !== "Hareket Var") return null;
      if (insp.tur2 === "Hamam Böceği Türleri") return "hamamboceği";
      if (insp.tur2 === "Karınca") return "karinca";
      return "kemirgen";
    }
    case "ic_uckun":
    case "dis_uckun": {
      const count = Number(insp.sayim);
      return Number.isFinite(count) && count > 0 ? "ucanHasere" : null;
    }
    default:
      return null;
  }
}

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
  occurrences: PeriyotOccurrenceWithEk1[],
  inspections: StationInspectionWithOccurrence[],
): CriticalRisksSummary {
  const today = todayStr();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = toLocalDateStr(thirtyDaysAgo);

  return {
    // Eski StationCheck.activityLevel (none/low/medium/high) yeni modelde yok — İstasyonlar
    // formu sabit seçim listeleri kullanıyor, seviye ayrımı yapmıyor (bkz.
    // classifyStationInspectionActivity). Bu yüzden "orta/yüksek" ayrımı değil, son 30
    // günde AKTİVİTE TESPİT EDİLEN tüm denetimler sayılıyor.
    highPestActivity: inspections.filter((i) => {
      const date = i.periyotOccurrence.periodDate;
      return date >= thirtyDaysAgoStr && date <= today && classifyStationInspectionActivity(i) !== null;
    }).length,
    // "Kontrol süresi geçmiş istasyon" artık KrokiStation'da tutulmuyor (bkz. tarihsiz
    // model) — mevcut, aynı kaydı ifade eden "Gecikmiş Servis" tanımıyla AYNI mantık
    // kullanılıyor (bkz. src/lib/ai/alerts/engine.ts evaluateOverdueService): planlanan
    // tarihi geçmiş ama Ek-1'i doldurulmamış periyot ziyaretleri.
    overdueStationChecks: occurrences.filter((o) => o.periodDate < today && !o.ek1Form).length,
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
  stationInspections: StationInspectionWithOccurrence[],
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
  // Bir periyot ziyaretinde genelde birden çok istasyon denetleniyor — akışı aynı
  // ziyaretin istasyon sayısı kadar tekrarlamamak için periyotOccurrence başına TEK
  // aktivite kaydı üretiliyor.
  const seenOccurrences = new Set<string>();
  for (const insp of stationInspections) {
    if (seenOccurrences.has(insp.periyotOccurrenceId)) continue;
    seenOccurrences.add(insp.periyotOccurrenceId);
    list.push({
      date: new Date(insp.periyotOccurrence.periodDate),
      item: {
        id: `station-insp-${insp.periyotOccurrenceId}`,
        type: "station_checked",
        message: `${insp.periyotOccurrence.customer.companyName} - istasyon kontrolü yapıldı`,
        actor: insp.periyotOccurrence.personnelName || "Sistem",
        timeAgo: formatTimeAgo(insp.periyotOccurrence.periodDate),
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

/** Kroki tabanlı İstasyonlar/QR Kontrol akışının gerçek verisi (StationInspection) üzerinden
 * haftalık haşere aktivite trendini hesaplar. Eskiden bu grafik artık teknisyenlerin
 * kullanmadığı, terk edilmiş `StationCheck` tablosundan besleniyordu — bu yüzden hep boştu
 * (bkz. computeCriticalRisks/computeRecentActivity'nin hâlâ kullandığı legacy `StationCheck`,
 * bunlar bu değişikliğin kapsamı dışında). */
export function computePestActivityTrend(inspections: StationInspectionWithOccurrence[]): PestActivityPoint[] {
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
    for (const insp of inspections) {
      const date = insp.periyotOccurrence.periodDate;
      if (date < startStr || date > endStr) continue;
      const category = classifyStationInspectionActivity(insp);
      if (category) point[category] += 1;
    }
    weeks.push(point);
  }
  return weeks;
}

export function computeAuditReadiness(
  occurrences: PeriyotOccurrenceWithEk1[],
  workOrders: Pick<PrismaWorkOrder, "status" | "hasReport">[],
  openCorrectiveActionCount: number,
): AuditReadiness {
  const today = todayStr();
  const stationsUpToDate = occurrences.length > 0 && occurrences.every((o) => o.periodDate >= today || o.ek1Form);
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
