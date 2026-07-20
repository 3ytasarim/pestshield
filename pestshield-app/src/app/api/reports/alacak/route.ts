import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { getAlacakRows } from "@/lib/finance-report-data";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const rows = await getAlacakRows(ownerId);
  return NextResponse.json({ rows });
}
