import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";
import { dailyReportSchema } from "@/lib/validations/tech-reports";

/** Teknisyenin müşteri bağlantısı olmayan genel günlük notları — sadece kendi kayıtlarını görür/oluşturur. */
export async function GET() {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const reports = await prisma.dailyReport.findMany({
    where: { ownerId, technicianId },
    orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const parsed = dailyReportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const report = await prisma.dailyReport.create({
    data: { ownerId, technicianId, ...parsed.data },
  });

  return NextResponse.json({ report });
}
