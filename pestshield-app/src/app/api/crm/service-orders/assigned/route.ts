import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";
import { serializeServiceOrder } from "@/lib/crm/serialize";

/** Giriş yapan teknisyenin "İlgili Personel" olarak atandığı hizmetleri (ServiceOrder) döner.
 * `assignedPersonnel` DB'de serbest metin bir kolon ama Hizmetler formunda her zaman bir
 * teknisyen SEÇİM listesinden (`.name`) dolduruluyor (bkz. hizmet-form.tsx) — bu yüzden
 * isim eşleşmesi, bu oturumda kurulan diğer teknisyen-eşleştirme desenleriyle aynı güvenilirlikte. */
export async function GET() {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const technician = await prisma.technician.findUnique({ where: { id: technicianId }, select: { name: true } });
  if (!technician) {
    return NextResponse.json({ message: "Teknisyen kaydı bulunamadı." }, { status: 403 });
  }

  const orders = await prisma.serviceOrder.findMany({
    where: { ownerId, assignedPersonnel: technician.name },
    include: { items: true, customer: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    serviceOrders: orders.map((o) => ({ ...serializeServiceOrder(o), customer: o.customer })),
  });
}
