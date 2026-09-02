import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTechnician } from "@/lib/api-auth";
import { technicalReportSchema } from "@/lib/validations/tech-reports";

/** Teknisyenin belirli bir müşteri için hazırladığı, belge ekli teknik raporlar — sadece kendi kayıtlarını görür/oluşturur. */
export async function GET(request: Request) {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");

  const reports = await prisma.technicalReport.findMany({
    where: { ownerId, technicianId, ...(customerId ? { customerId } : {}) },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const { ownerId, technicianId, error } = await requireTechnician();
  if (error) return error;

  const parsed = technicalReportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({ where: { id: parsed.data.customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const report = await prisma.technicalReport.create({
    data: { ownerId, technicianId, ...parsed.data },
    include: { customer: { select: { id: true, companyName: true } } },
  });

  return NextResponse.json({ report });
}
