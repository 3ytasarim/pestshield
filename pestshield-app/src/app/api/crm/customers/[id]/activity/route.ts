import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import type { ActivityItem, ActivityType } from "@/lib/mock/crm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id: customerId } = await params;

  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const [workOrders, offers, contracts, collections] = await Promise.all([
    prisma.workOrder.findMany({
      where: { customerId, ownerId, status: "completed", completedDate: { not: null } },
      orderBy: { completedDate: "desc" },
      take: 5,
    }),
    prisma.offer.findMany({
      where: { customerId, ownerId, status: { in: ["sent", "accepted", "rejected"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.contract.findMany({
      where: { customerId, ownerId, fileName: { not: null } },
      orderBy: { startDate: "desc" },
      take: 5,
    }),
    prisma.collection.findMany({
      where: { customerId, ownerId },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const items: ActivityItem[] = [
    ...workOrders.map((order) => ({
      id: `wo-${order.id}`,
      customerId,
      type: "service_completed" as ActivityType,
      message: `${order.serviceType} hizmeti tamamlandı`,
      date: order.completedDate!,
    })),
    ...offers.map((offer) => ({
      id: `of-${offer.id}`,
      customerId,
      type: "offer_sent" as ActivityType,
      message: `${offer.title} teklifi ${offer.status === "sent" ? "gönderildi" : offer.status === "accepted" ? "kabul edildi" : "reddedildi"}`,
      date: offer.createdAt,
    })),
    ...contracts.map((contract) => ({
      id: `ct-${contract.id}`,
      customerId,
      type: "contract_uploaded" as ActivityType,
      message: `${contract.contractNo} sözleşme belgesi yüklendi`,
      date: contract.startDate,
    })),
    ...collections.map((collection) => ({
      id: `cl-${collection.id}`,
      customerId,
      type: "payment_received" as ActivityType,
      message: `Tahsilat alındı${collection.description ? `: ${collection.description}` : ""}`,
      date: collection.date,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);

  return NextResponse.json({ activity: items });
}
