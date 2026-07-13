// PestShield Bildirim Merkezi veri katmanı.
//
// Burada AYRI, sahte bir bildirim listesi TUTULMAZ — bu modül mevcut diğer
// modüllerdeki (CRM, Envanter, Denetim, Operasyon, Finans) gerçek sinyalleri
// tarayıp bildirime dönüştürür. Böylece "3 kritik stok" bildirimi ile
// Envanter sayfasındaki kritik stok sayısı asla çelişmez.

import { getAllContracts, getAllWorkOrders, getCustomerById } from "@/lib/mock/crm";
import { getCriticalProducts } from "@/lib/mock/inventory";
import { getOpenCorrectiveActions, getHighRisks } from "@/lib/mock/audit";
import { getOverdueStations, technicians, vehicles, isLicenseExpiringSoon, isVehicleDueSoon } from "@/lib/mock/operations";
import { getOverdueCustomers } from "@/lib/mock/finance";

export type NotificationType = "work_order" | "contract" | "stock" | "station" | "capa" | "risk" | "payment" | "fleet";
export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority: NotificationPriority;
  link: string | null;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildNotifications(): Notification[] {
  const items: Notification[] = [];
  let seq = 0;
  function next() {
    seq += 1;
    return `notif-${String(seq).padStart(3, "0")}`;
  }

  // Vadesi geçen istasyon kontrolleri
  getOverdueStations()
    .slice(0, 6)
    .forEach((station, i) => {
      const customer = getCustomerById(station.customerId);
      items.push({
        id: next(),
        type: "station",
        title: "İstasyon kontrolü gecikti",
        message: `${customer?.companyName ?? "Müşteri"} — ${station.label} için periyodik kontrol tarihi geçti.`,
        createdAt: daysFromNow(-(i + 1)),
        read: i > 2,
        priority: "high",
        link: "/dashboard/client/stations",
      });
    });

  // Süresi yakında dolan sözleşmeler
  getAllContracts()
    .filter((c) => c.status === "expiring")
    .forEach((contract, i) => {
      const customer = getCustomerById(contract.customerId);
      items.push({
        id: next(),
        type: "contract",
        title: "Sözleşme süresi yaklaşıyor",
        message: `${customer?.companyName ?? "Müşteri"} sözleşmesi ${contract.remainingDays} gün içinde sona erecek.`,
        createdAt: daysFromNow(-(i + 2)),
        read: false,
        priority: "normal",
        link: "/dashboard/client/contracts",
      });
    });

  // Kritik stok
  getCriticalProducts()
    .slice(0, 4)
    .forEach((product, i) => {
      items.push({
        id: next(),
        type: "stock",
        title: "Kritik stok seviyesi",
        message: `${product.name} kritik seviyenin altına düştü (${product.currentStock} kaldı).`,
        createdAt: daysFromNow(-(i + 1)),
        read: i > 1,
        priority: "high",
        link: "/dashboard/client/critical-stock",
      });
    });

  // Açık düzeltici faaliyetler
  getOpenCorrectiveActions()
    .slice(0, 4)
    .forEach((capa, i) => {
      items.push({
        id: next(),
        type: "capa",
        title: "Düzeltici faaliyet bekliyor",
        message: `"${capa.title}" — sorumlu: ${capa.responsible}, vade: ${capa.dueDate.slice(0, 10)}.`,
        createdAt: daysFromNow(-(i + 3)),
        read: i > 1,
        priority: capa.severity === "critical" ? "critical" : "normal",
        link: "/dashboard/client/corrective-actions",
      });
    });

  // Yüksek/kritik riskler
  getHighRisks()
    .slice(0, 3)
    .forEach((risk, i) => {
      items.push({
        id: next(),
        type: "risk",
        title: "Yüksek risk kaydı",
        message: `"${risk.title}" — skor ${risk.likelihood * risk.impact}/25.`,
        createdAt: daysFromNow(-(i + 4)),
        read: true,
        priority: "high",
        link: "/dashboard/client/risk-management",
      });
    });

  // Ehliyet/muayene/sigorta/ruhsat
  technicians.filter(isLicenseExpiringSoon).forEach((tech, i) => {
    items.push({
      id: next(),
      type: "fleet",
      title: "Teknisyen ehliyeti yenilenmeli",
      message: `${tech.name} — ehliyeti ${tech.licenseExpiry.slice(0, 10)} tarihinde doluyor.`,
      createdAt: daysFromNow(-(i + 1)),
      read: false,
      priority: "normal",
      link: "/dashboard/client/technicians",
    });
  });

  vehicles.filter(isVehicleDueSoon).forEach((vehicle, i) => {
    items.push({
      id: next(),
      type: "fleet",
      title: "Araç muayene/sigorta/ruhsat yaklaşıyor",
      message: `${vehicle.plate} — muayene ${vehicle.inspectionDue.slice(0, 10)}, sigorta ${vehicle.insuranceDue.slice(0, 10)}, ruhsat ${vehicle.registrationExpiry.slice(0, 10)}.`,
      createdAt: daysFromNow(-(i + 2)),
      read: false,
      priority: "normal",
      link: "/dashboard/client/vehicles",
    });
  });

  // Vadesi geçen tahsilatlar
  getOverdueCustomers()
    .slice(0, 4)
    .forEach((customer, i) => {
      items.push({
        id: next(),
        type: "payment",
        title: "Tahsilat vadesi geçti",
        message: `${customer.companyName} — ${customer.pendingCollection.toLocaleString("tr-TR")} ₺ bekleyen tahsilat.`,
        createdAt: daysFromNow(-(i + 1)),
        read: i > 0,
        priority: "high",
        link: "/dashboard/client/payment-tracking",
      });
    });

  // Bugün/yakında planlanan iş emirleri
  getAllWorkOrders()
    .filter((w) => w.status === "planned")
    .slice(0, 3)
    .forEach((order, i) => {
      const customer = getCustomerById(order.customerId);
      items.push({
        id: next(),
        type: "work_order",
        title: "Yeni iş emri planlandı",
        message: `${customer?.companyName ?? "Müşteri"} için ${order.orderNo} numaralı iş emri ${order.plannedDate} tarihine planlandı.`,
        createdAt: daysFromNow(-i),
        read: false,
        priority: "low",
        link: "/dashboard/client/work-orders",
      });
    });

  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const notifications: Notification[] = buildNotifications();

export function getUnreadCount(list: Notification[] = notifications): number {
  return list.filter((n) => !n.read).length;
}
