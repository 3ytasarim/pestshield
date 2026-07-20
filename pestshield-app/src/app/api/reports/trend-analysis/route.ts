import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { computeTrendAnalysis } from "@/lib/trend-analysis";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const serviceOrderId = searchParams.get("serviceOrderId");
  const asOfMonthKey = searchParams.get("asOfMonthKey") ?? undefined;
  if (!serviceOrderId) {
    return NextResponse.json({ message: "serviceOrderId zorunludur." }, { status: 400 });
  }

  const analysis = await computeTrendAnalysis(ownerId, serviceOrderId, asOfMonthKey);
  return NextResponse.json({ analysis });
}
