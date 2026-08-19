import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOrTechOwner } from "@/lib/api-auth";

/** Tek bir KrokiStation'ı, mobil QR tarama akışının ihtiyaç duyduğu müşteri/hizmet/kroki
 * bağlamıyla birlikte döner — Operasyon > İstasyonlar ve QR Kontrol sayfalarındaki
 * include zinciriyle aynı desendir (KrokiStation → KrokiSketch → ServiceOrder → Customer). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;

  const { id } = await params;
  const station = await prisma.krokiStation.findFirst({
    where: { id, ownerId },
    include: {
      krokiSketch: {
        select: {
          id: true,
          name: true,
          serviceOrderId: true,
          serviceOrder: { select: { description: true, customer: { select: { id: true, companyName: true } } } },
        },
      },
    },
  });
  if (!station) {
    return NextResponse.json({ message: "İstasyon bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    station: {
      id: station.id,
      type: station.type,
      number: station.number,
      stationId: station.stationId,
      krokiSketchId: station.krokiSketch.id,
      sketchName: station.krokiSketch.name,
      serviceOrderId: station.krokiSketch.serviceOrderId,
      serviceName: station.krokiSketch.serviceOrder.description,
      customer: station.krokiSketch.serviceOrder.customer,
    },
  });
}
