import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarSelectCalendarSchema } from "@/lib/validations/integrations";

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = googleCalendarSelectCalendarSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const existing = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Önce Google Calendar bağlantısı kurmanız gerekiyor." }, { status: 400 });
  }

  await prisma.googleCalendarIntegration.update({
    where: { ownerId },
    data: { calendarId: parsed.data.calendarId, calendarName: parsed.data.calendarName },
  });

  return NextResponse.json({ ok: true });
}
