import "server-only";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date-utils";
import type { Notification } from "@/lib/mock/notifications";

function toIso(dateStr: string): string {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Bildirim Merkezi — AYRI, sahte bir bildirim listesi TUTULMAZ. Diğer
 * modüllerdeki (CRM, Envanter, Denetim, Operasyon, Finans) gerçek Postgres
 * kayıtları taranıp bildirime dönüştürülür, hepsi `ownerId` ile bu firmaya
 * izole edilir.
 */
export async function buildNotifications(ownerId: string): Promise<Notification[]> {
  const today = todayStr();
  const items: Notification[] = [];
  let seq = 0;
  function next() {
    seq += 1;
    return `notif-${String(seq).padStart(3, "0")}`;
  }

  const [
    overdueStations,
    expiringContracts,
    criticalProducts,
    openCorrectiveActions,
    highRisks,
    expiringTechnicians,
    dueVehicles,
    overdueInvoices,
    plannedWorkOrders,
  ] = await Promise.all([
    prisma.station.findMany({
      where: { ownerId, nextCheckDue: { lt: today } },
      include: { customer: { select: { companyName: true } } },
      orderBy: { nextCheckDue: "asc" },
      take: 6,
    }),
    prisma.contract.findMany({
      where: { ownerId, status: "expiring" },
      include: { customer: { select: { companyName: true } } },
      orderBy: { remainingDays: "asc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: { ownerId },
      take: 50,
    }).then((products) => products.filter((p) => Number(p.currentStock) <= Number(p.criticalLevel)).slice(0, 4)),
    prisma.correctiveAction.findMany({
      where: { ownerId, status: { in: ["open", "in_progress"] } },
      orderBy: { dueDate: "asc" },
      take: 4,
    }),
    prisma.risk.findMany({
      where: { ownerId, status: { not: "closed" } },
      take: 20,
    }).then((risks) => risks.filter((r) => r.likelihood * r.impact >= 9).slice(0, 3)),
    prisma.technician.findMany({
      where: { ownerId, licenseExpiry: { not: "" } },
    }).then((techs) =>
      techs.filter((t) => {
        const days = Math.round((new Date(t.licenseExpiry).getTime() - Date.now()) / 86_400_000);
        return days >= 0 && days <= 60;
      }),
    ),
    prisma.vehicle.findMany({ where: { ownerId } }).then((vehicles) =>
      vehicles.filter((v) => {
        const dueSoon = (dateStr: string) => {
          if (!dateStr) return false;
          const days = Math.round((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
          return days >= 0 && days <= 30;
        };
        return dueSoon(v.inspectionDue) || dueSoon(v.insuranceDue) || dueSoon(v.registrationExpiry);
      }),
    ),
    prisma.invoice.findMany({
      where: { ownerId, status: { not: "paid" }, dueDate: { lt: today } },
      include: { customer: { select: { companyName: true } } },
      orderBy: { dueDate: "asc" },
      take: 4,
    }),
    prisma.workOrder.findMany({
      where: { ownerId, status: "planned" },
      include: { customer: { select: { companyName: true } } },
      orderBy: { plannedDate: "asc" },
      take: 3,
    }),
  ]);

  overdueStations.forEach((station) => {
    items.push({
      id: next(),
      type: "station",
      title: "İstasyon kontrolü gecikti",
      message: `${station.customer.companyName} — ${station.label} için periyodik kontrol tarihi geçti.`,
      createdAt: toIso(station.nextCheckDue),
      read: false,
      priority: "high",
      link: "/dashboard/client/stations",
    });
  });

  expiringContracts.forEach((contract) => {
    items.push({
      id: next(),
      type: "contract",
      title: "Sözleşme süresi yaklaşıyor",
      message: `${contract.customer.companyName} sözleşmesi ${contract.remainingDays} gün içinde sona erecek.`,
      createdAt: toIso(contract.endDate),
      read: false,
      priority: "normal",
      link: "/dashboard/client/contracts",
    });
  });

  criticalProducts.forEach((product) => {
    items.push({
      id: next(),
      type: "stock",
      title: "Kritik stok seviyesi",
      message: `${product.name} kritik seviyenin altına düştü (${product.currentStock} kaldı).`,
      createdAt: new Date().toISOString(),
      read: false,
      priority: "high",
      link: "/dashboard/client/critical-stock",
    });
  });

  openCorrectiveActions.forEach((capa) => {
    items.push({
      id: next(),
      type: "capa",
      title: "Düzeltici faaliyet bekliyor",
      message: `"${capa.title}" — sorumlu: ${capa.responsible}, vade: ${capa.dueDate.slice(0, 10)}.`,
      createdAt: toIso(capa.dueDate),
      read: false,
      priority: capa.severity === "critical" ? "critical" : "normal",
      link: "/dashboard/client/corrective-actions",
    });
  });

  highRisks.forEach((risk) => {
    items.push({
      id: next(),
      type: "risk",
      title: "Yüksek risk kaydı",
      message: `"${risk.title}" — skor ${risk.likelihood * risk.impact}/25.`,
      createdAt: toIso(risk.reviewDate),
      read: false,
      priority: "high",
      link: "/dashboard/client/risk-management",
    });
  });

  expiringTechnicians.forEach((tech) => {
    items.push({
      id: next(),
      type: "fleet",
      title: "Teknisyen ehliyeti yenilenmeli",
      message: `${tech.name} — ehliyeti ${tech.licenseExpiry.slice(0, 10)} tarihinde doluyor.`,
      createdAt: toIso(tech.licenseExpiry),
      read: false,
      priority: "normal",
      link: "/dashboard/client/technicians",
    });
  });

  dueVehicles.forEach((vehicle) => {
    items.push({
      id: next(),
      type: "fleet",
      title: "Araç muayene/sigorta/ruhsat yaklaşıyor",
      message: `${vehicle.plate} — muayene ${vehicle.inspectionDue.slice(0, 10)}, sigorta ${vehicle.insuranceDue.slice(0, 10)}, ruhsat ${vehicle.registrationExpiry.slice(0, 10)}.`,
      createdAt: new Date().toISOString(),
      read: false,
      priority: "normal",
      link: "/dashboard/client/vehicles",
    });
  });

  overdueInvoices.forEach((invoice) => {
    items.push({
      id: next(),
      type: "payment",
      title: "Tahsilat vadesi geçti",
      message: `${invoice.customer.companyName} — ${Number(invoice.amount).toLocaleString("tr-TR")} ₺ bekleyen tahsilat.`,
      createdAt: toIso(invoice.dueDate),
      read: false,
      priority: "high",
      link: "/dashboard/client/payment-tracking",
    });
  });

  plannedWorkOrders.forEach((order) => {
    items.push({
      id: next(),
      type: "work_order",
      title: "Yeni iş emri planlandı",
      message: `${order.customer.companyName} için ${order.orderNo} numaralı iş emri ${order.plannedDate} tarihine planlandı.`,
      createdAt: toIso(order.plannedDate),
      read: false,
      priority: "low",
      link: "/dashboard/client/work-orders",
    });
  });

  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
