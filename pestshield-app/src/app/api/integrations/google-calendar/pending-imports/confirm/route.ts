import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeWorkOrder } from "@/lib/crm/serialize";
import { syncWorkOrderToCalendar } from "@/lib/integrations/google-calendar/sync";
import { sendWorkOrderTemplates } from "@/lib/messaging/send-work-order-templates";

const confirmSchema = z.object({
  googleEventId: z.string().min(1),
  customerId: z.string().min(1, "Müşteri seçiniz"),
  technicianId: z.string().min(1, "Teknisyen seçiniz"),
  serviceType: z.string().min(1, "Hizmet türü seçiniz"),
  plannedDate: z.string().min(1, "Planlanan tarih zorunludur"),
});

// Google Calendar'da doğrudan oluşturulmuş bir etkinliği, kullanıcının
// onayladığı müşteri/hizmet türüyle gerçek bir İş Emri'ne dönüştürür.
// googleEventId doğrudan atanır — syncWorkOrderToCalendar bundan sonra bu
// AYNI etkinliği günceller (yeni bir tane oluşturmaz), iki taraf senkron kalır.
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = confirmSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { googleEventId, customerId, technicianId, serviceType, plannedDate } = parsed.data;

  const alreadyImported = await prisma.workOrder.findFirst({ where: { ownerId, googleEventId } });
  if (alreadyImported) {
    return NextResponse.json({ message: "Bu etkinlik zaten bir İş Emri'ne aktarılmış." }, { status: 409 });
  }

  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }
  const technician = await prisma.technician.findFirst({ where: { id: technicianId, ownerId } });
  if (!technician) {
    return NextResponse.json({ message: "Teknisyen bulunamadı." }, { status: 404 });
  }

  const orderCount = await prisma.workOrder.count({ where: { ownerId, customerId } });

  const order = await prisma.workOrder.create({
    data: {
      ownerId,
      customerId,
      technicianId,
      serviceType,
      plannedDate,
      googleEventId,
      orderNo: `IS-2026-${String(orderCount + 1).padStart(3, "0")}`,
      status: "planned",
    },
    include: { technician: true },
  });

  try {
    await syncWorkOrderToCalendar(ownerId, order.id);
  } catch {
    // Takvim senkronu İş Emri oluşturmayı asla engellemez.
  }

  try {
    await sendWorkOrderTemplates(ownerId, order.id, "work_order_created");
  } catch {
    // Mail/WhatsApp gönderimi İş Emri oluşturmayı asla engellemez.
  }

  return NextResponse.json({ workOrder: serializeWorkOrder(order) }, { status: 201 });
}
