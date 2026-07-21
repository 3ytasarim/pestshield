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

  const [owner, customers, offers, serviceOrders, stations, stationChecks, workOrders, openCorrectiveActionCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: ownerId }, select: { companyName: true, logoUrl: true } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true, createdAt: true } }),
    prisma.offer.findMany({
      where: { ownerId },
      select: { createdAt: true, status: true, amount: true, validUntil: true, customer: { select: { companyName: true } } },
    }),
    prisma.serviceOrder.findMany({ where: { ownerId }, select: { approved: true } }),
    prisma.station.findMany({ where: { ownerId }, select: { nextCheckDue: true } }),
    prisma.stationCheck.findMany({
      where: { ownerId },
      include: {
        technician: { select: { name: true } },
        station: { select: { type: true, customerId: true, customer: { select: { companyName: true } } } },
      },
    }),
    prisma.workOrder.findMany({
      where: { ownerId },
      include: { customer: { select: { companyName: true } }, technician: { select: { name: true } } },
    }),
    prisma.correctiveAction.count({ where: { ownerId, status: { in: ["open", "in_progress"] } } }),
  ]);

  const criticalRisks = computeCriticalRisks(stations, stationChecks);
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
      recentActivity={computeRecentActivity(customers, offers, workOrders, stationChecks)}
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments}
      pestActivityTrend={computePestActivityTrend(stationChecks)}
      auditReadiness={computeAuditReadiness(stations, workOrders, openCorrectiveActionCount)}
    />
  );
}
