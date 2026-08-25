import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const bodySchema = z.object({
  type: z.enum(["break_start", "break_end", "customer_arrival", "customer_departure"]),
  customerId: z.string().optional(),
});

/** Teknisyenin gün içindeki ara durumlarını (Mola, Müşteride) append-only event olarak
 * kaydeder — TechnicianLocationPing (konum) ile aynı desende, TechnicianWorkday'e bağlı.
 * Basit bir state machine ile tutarsız geçişler (ör. moladayken tekrar mola başlatma)
 * reddedilir; kontrol her zaman o workday'in EN SON event'ine bakılarak yapılır. */
export async function POST(request: Request) {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const workday = await prisma.technicianWorkday.findUnique({
    where: { technicianId_date: { technicianId, date: todayKey() } },
    include: { events: { orderBy: { occurredAt: "desc" }, take: 1 } },
  });
  if (!workday || workday.status !== "in_progress") {
    return NextResponse.json({ message: "Aktif bir mesai bulunamadı." }, { status: 400 });
  }

  const lastEvent = workday.events[0] ?? null;
  const onBreak = lastEvent?.type === "break_start";
  const atCustomer = lastEvent?.type === "customer_arrival";

  const { type, customerId } = parsed.data;
  if (type === "break_start" && onBreak) {
    return NextResponse.json({ message: "Zaten moladasınız." }, { status: 400 });
  }
  if (type === "break_end" && !onBreak) {
    return NextResponse.json({ message: "Molada değilsiniz." }, { status: 400 });
  }
  if (type === "customer_arrival" && atCustomer) {
    return NextResponse.json({ message: "Zaten bir müşterideyseniz, önce ayrılın." }, { status: 400 });
  }
  if (type === "customer_arrival" && !customerId) {
    return NextResponse.json({ message: "Müşteri seçiniz." }, { status: 400 });
  }
  if (type === "customer_departure" && !atCustomer) {
    return NextResponse.json({ message: "Şu anda bir müşteride değilsiniz." }, { status: 400 });
  }

  const event = await prisma.workdayEvent.create({
    data: {
      ownerId,
      workdayId: workday.id,
      type,
      customerId: type === "customer_arrival" ? customerId : type === "customer_departure" ? lastEvent!.customerId : null,
    },
    include: { customer: { select: { id: true, companyName: true } } },
  });

  return NextResponse.json({ event });
}
