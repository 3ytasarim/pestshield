import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayKey();

  const [workdays, technicians] = await Promise.all([
    prisma.technicianWorkday.findMany({
      where: { ownerId, date },
      include: {
        technician: { select: { id: true, name: true } },
        pings: { orderBy: { recordedAt: "asc" } },
      },
      orderBy: { startedAt: "asc" },
    }),
    prisma.technician.findMany({
      where: { ownerId, status: "active" },
      select: { id: true, name: true },
    }),
  ]);

  const byTechnicianId = new Map(workdays.map((w) => [w.technicianId, w]));

  const result = technicians.map((tech) => {
    const workday = byTechnicianId.get(tech.id);
    if (!workday) {
      return {
        id: `wd-${tech.id}-${date}`,
        technicianName: tech.name,
        date,
        status: "not_started" as const,
        startedAt: null,
        endedAt: null,
        pings: [] as { lat: number; lng: number; recordedAt: Date }[],
      };
    }
    return {
      id: workday.id,
      technicianName: tech.name,
      date: workday.date,
      status: workday.status,
      startedAt: workday.startedAt,
      endedAt: workday.endedAt,
      pings: workday.pings.map((p) => ({ lat: p.lat, lng: p.lng, recordedAt: p.recordedAt })),
    };
  });

  return NextResponse.json({ date, workdays: result });
}
