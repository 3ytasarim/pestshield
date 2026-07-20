import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST() {
  const { technicianId, error } = await requireTechnician();
  if (error) return error;

  const workday = await prisma.technicianWorkday.findUnique({
    where: { technicianId_date: { technicianId, date: todayKey() } },
  });
  if (!workday || workday.status !== "in_progress") {
    return NextResponse.json({ message: "Aktif bir mesai bulunamadı." }, { status: 400 });
  }

  const updated = await prisma.technicianWorkday.update({
    where: { id: workday.id },
    data: { status: "completed", endedAt: new Date() },
    include: { pings: { orderBy: { recordedAt: "asc" } } },
  });

  return NextResponse.json({ workday: updated });
}
