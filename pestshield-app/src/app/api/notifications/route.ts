import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { buildNotifications } from "@/lib/notifications/build";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const notifications = await buildNotifications(ownerId);
  return NextResponse.json({ notifications });
}
