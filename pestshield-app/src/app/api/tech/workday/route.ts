import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const { technicianId, error } = await requireTechnician();
  if (error) return error;

  const workday = await prisma.technicianWorkday.findUnique({
    where: { technicianId_date: { technicianId, date: todayKey() } },
    include: { pings: { orderBy: { recordedAt: "asc" } } },
  });

  return NextResponse.json({ workday });
}

export async function POST() {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const date = todayKey();
  const existing = await prisma.technicianWorkday.findUnique({
    where: { technicianId_date: { technicianId, date } },
  });
  if (existing) {
    return NextResponse.json({ message: "Bugün için zaten bir mesai kaydı var." }, { status: 400 });
  }

  const workday = await prisma.technicianWorkday.create({
    data: {
      ownerId,
      technicianId,
      date,
      status: "in_progress",
      startedAt: new Date(),
    },
    include: { pings: true },
  });

  return NextResponse.json({ workday });
}
