import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import type { AiReportResultData } from "@/lib/ai/types";

/** Kaydedilmiş "Otomatik Rapor" listesini döner — opsiyonel olarak tek bir müşteriye filtrelenebilir. */
export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");
  const reports = await prisma.generatedReport.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      title: r.title,
      reportType: r.reportType,
      periodFrom: r.periodFrom,
      periodTo: r.periodTo,
      customerId: r.customerId,
      customerName: r.customer?.companyName ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/** Üretilmiş bir "Otomatik Rapor" sonucunu (AiReportResultData) kalıcı olarak kaydeder. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  let body: { report?: AiReportResultData; customerId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const report = body.report;
  if (!report || typeof report !== "object" || !report.title || !report.period) {
    return NextResponse.json({ message: "Kaydedilecek rapor verisi eksik." }, { status: 400 });
  }

  if (body.customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: body.customerId, ownerId } });
    if (!customer) {
      return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
    }
  }

  const saved = await prisma.generatedReport.create({
    data: {
      ownerId,
      customerId: body.customerId ?? null,
      title: report.title,
      reportType: report.reportType,
      periodFrom: report.period.from,
      periodTo: report.period.to,
      data: report as object,
    },
  });

  return NextResponse.json({ id: saved.id }, { status: 201 });
}
