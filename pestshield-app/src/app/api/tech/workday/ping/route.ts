import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";

const pingSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const body = await request.json();
  const parsed = pingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Geçersiz konum verisi." }, { status: 400 });
  }

  const workday = await prisma.technicianWorkday.findUnique({
    where: { technicianId_date: { technicianId, date: todayKey() } },
  });
  if (!workday || workday.status !== "in_progress") {
    return NextResponse.json({ message: "Aktif bir mesai bulunamadı." }, { status: 400 });
  }

  const ping = await prisma.technicianLocationPing.create({
    data: {
      ownerId,
      workdayId: workday.id,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      recordedAt: new Date(),
    },
  });

  return NextResponse.json({ ping });
}
