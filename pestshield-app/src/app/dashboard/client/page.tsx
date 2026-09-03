import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSessionPermissions } from "@/lib/api-auth";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import {
  computeTodayServices,
  computeOpenJobs,
  computePendingOffers,
  computePendingCollections,
  computeCriticalRisks,
  computeAiRecommendations,
  computeRecentActivity,
  computeAppointments,
  computePestActivityTrend,
  computeAuditReadiness,
} from "@/lib/dashboard/compute";

export default async function ClientDashboardPage() {
  const permissions = await getSessionPermissions();
  if (permissions?.visibleNavHrefs) {
    if (permissions.visibleNavHrefs.length === 0) {
      return (
        <EmptyState
          icon={ShieldAlert}
          title="Yetkiniz bulunmuyor"
          description="Hesabınıza henüz bir bölüm ataması yapılmamış. Firma yöneticinizle iletişime geçin."
        />
      );
    }
    if (!permissions.visibleNavHrefs.includes("/dashboard/client")) {
      redirect(permissions.visibleNavHrefs[0]);
    }
  }

  const session = await auth();
  const ownerId = session!.user.id;

  const [owner, customers, offers, serviceOrders, periyotOccurrences, stationInspections, workOrders, openCorrectiveActionCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: ownerId }, select: { companyName: true, logoUrl: true } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true, createdAt: true } }),
    prisma.offer.findMany({
      where: { ownerId },
      select: { createdAt: true, status: true, amount: true, validUntil: true, customer: { select: { companyName: true } } },
    }),
    prisma.serviceOrder.findMany({ where: { ownerId }, select: { approved: true } }),
    // "Kritik Riskler"deki gecikmiş kontrol sayısı ve "Denetime Hazırlık" skoru için —
    // eski Station.nextCheckDue yerine, mevcut "Gecikmiş Servis" tanımıyla AYNI mantık
    // (bkz. src/lib/ai/alerts/engine.ts): planlanan tarihi geçmiş ama Ek-1'i doldurulmamış
    // periyot ziyaretleri.
    prisma.periyotOccurrence.findMany({
      where: { ownerId },
      select: { periodDate: true, ek1Form: { select: { id: true } } },
    }),
    // Haşere Aktivite Trendi grafiği, "Kritik Riskler"deki haşere aktivitesi sayısı ve
    // "Son Aktiviteler"deki istasyon kontrolü kayıtları için — gerçek/güncel veri kaynağı.
    // Eskiden bunlar teknisyenlerin artık kullanmadığı Station/StationCheck'ten besleniyordu
    // (bkz. computePestActivityTrend'in yorumu), bu yüzden hep boş/durağandı.
    prisma.stationInspection.findMany({
      where: { ownerId },
      select: {
        stationType: true,
        tuketim: true,
        hareket: true,
        tur1: true,
        tur2: true,
        sayim: true,
        periyotOccurrenceId: true,
        periyotOccurrence: { select: { periodDate: true, personnelName: true, customer: { select: { companyName: true } } } },
      },
    }),
    prisma.workOrder.findMany({
      where: { ownerId },
      include: { customer: { select: { companyName: true } }, technician: { select: { name: true } } },
    }),
    prisma.correctiveAction.count({ where: { ownerId, status: { in: ["open", "in_progress"] } } }),
  ]);

  const criticalRisks = computeCriticalRisks(periyotOccurrences, stationInspections);
  const pendingOffers = computePendingOffers(offers);
  const { today: todayAppointments, upcoming: upcomingAppointments } = computeAppointments(workOrders);

  return (
    <DashboardClient
      userName={session?.user?.name ?? "Kullanıcı"}
      registeredCompanyName={owner?.companyName ?? null}
      registeredLogoUrl={owner?.logoUrl ?? null}
      todayServices={computeTodayServices(workOrders)}
      openJobs={computeOpenJobs(workOrders, serviceOrders)}
      pendingOffers={pendingOffers}
      pendingCollections={computePendingCollections()}
      criticalRisks={criticalRisks}
      aiRecommendations={computeAiRecommendations(criticalRisks, pendingOffers)}
      recentActivity={computeRecentActivity(customers, offers, workOrders, stationInspections)}
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments}
      pestActivityTrend={computePestActivityTrend(stationInspections)}
      auditReadiness={computeAuditReadiness(periyotOccurrences, workOrders, openCorrectiveActionCount)}
    />
  );
}
