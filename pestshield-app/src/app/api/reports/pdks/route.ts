import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

function distanceKm(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    total += R * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
  }
  return Math.round(total * 10) / 10;
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const technicianId = searchParams.get("technicianId");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const [workdays, stationChecks] = await Promise.all([
    prisma.technicianWorkday.findMany({
      where: {
        ownerId,
        ...(technicianId ? { technicianId } : {}),
        ...(startDate ? { date: { gte: startDate } } : {}),
        ...(endDate ? { date: { lte: endDate } } : {}),
      },
      include: {
        technician: { select: { id: true, name: true } },
        pings: { orderBy: { recordedAt: "asc" } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.stationCheck.findMany({
      where: {
        ownerId,
        ...(technicianId ? { technicianId } : {}),
        ...(startDate ? { checkedAt: { gte: startDate } } : {}),
        ...(endDate ? { checkedAt: { lte: `${endDate}T23:59:59.999Z` } } : {}),
      },
      select: { technicianId: true, checkedAt: true },
    }),
  ]);

  const checkCountByTechnicianDate = new Map<string, number>();
  for (const check of stationChecks) {
    if (!check.technicianId) continue;
    const key = `${check.technicianId}-${check.checkedAt.slice(0, 10)}`;
    checkCountByTechnicianDate.set(key, (checkCountByTechnicianDate.get(key) ?? 0) + 1);
  }

  const rows = workdays.map((w) => {
    const durationMinutes =
      w.startedAt && w.endedAt ? Math.round((w.endedAt.getTime() - w.startedAt.getTime()) / 60_000) : null;
    return {
      workdayId: w.id,
      technicianName: w.technician?.name ?? "—",
      date: w.date,
      status: w.status,
      startTime: formatTime(w.startedAt),
      endTime: formatTime(w.endedAt),
      durationMinutes,
      stopCount: checkCountByTechnicianDate.get(`${w.technicianId}-${w.date}`) ?? 0,
      distanceKm: distanceKm(w.pings.map((p) => ({ lat: p.lat, lng: p.lng }))),
    };
  });

  return NextResponse.json({ rows });
}
