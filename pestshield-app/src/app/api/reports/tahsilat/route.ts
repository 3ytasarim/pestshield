import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { getTahsilatRows } from "@/lib/finance-report-data";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const customerId = searchParams.get("customerId") || undefined;

  const rows = await getTahsilatRows(ownerId, { startDate, endDate, customerId });
  return NextResponse.json({ rows });
}
