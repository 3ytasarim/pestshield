import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";
import { computeTrendAnalysis } from "@/lib/trend-analysis";

/** Müşteri portalı — sadece giriş yapan müşteriye ait bir hizmete ait trend analizi. */
export async function GET(request: Request) {
  const { ownerId, customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const serviceOrderId = searchParams.get("serviceOrderId");
  const asOfMonthKey = searchParams.get("asOfMonthKey") ?? undefined;
  if (!serviceOrderId) {
    return NextResponse.json({ message: "serviceOrderId zorunludur." }, { status: 400 });
  }

  const order = await prisma.serviceOrder.findFirst({ where: { id: serviceOrderId, ownerId, customerId } });
  if (!order) {
    return NextResponse.json({ message: "Hizmet kaydı bulunamadı." }, { status: 404 });
  }

  const analysis = await computeTrendAnalysis(ownerId, serviceOrderId, asOfMonthKey);
  return NextResponse.json({ analysis });
}
