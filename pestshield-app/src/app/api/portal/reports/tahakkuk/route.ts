import { NextResponse } from "next/server";
import { requireCustomerOwner } from "@/lib/api-auth";
import { getTahakkukRows, type TahakkukDurumu } from "@/lib/tahakkuk-report-data";

/** Müşteri portalı — sadece giriş yapan müşteriye ait tahakkuk kayıtları. */
export async function GET(request: Request) {
  const { ownerId, customerId, error } = await requireCustomerOwner();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const durum = (searchParams.get("durum") as TahakkukDurumu | null) || undefined;

  const rows = await getTahakkukRows(ownerId, { startDate, endDate, customerId, durum });
  return NextResponse.json({ rows });
}
