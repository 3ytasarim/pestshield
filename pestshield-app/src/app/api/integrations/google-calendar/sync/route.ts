import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { syncUpcomingWorkOrders } from "@/lib/integrations/google-calendar/sync";

export async function POST() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const result = await syncUpcomingWorkOrders(ownerId);
  if (result.error) {
    return NextResponse.json({ message: result.error, synced: result.synced }, { status: 400 });
  }
  return NextResponse.json(result);
}
