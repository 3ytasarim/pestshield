import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const integration = await prisma.whatsAppIntegration.findUnique({ where: { ownerId } });
  if (!integration) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    phoneNumberId: integration.phoneNumberId,
    businessAccountId: integration.businessAccountId,
    apiVersion: integration.apiVersion,
    connectedAt: integration.connectedAt,
    lastSyncAt: integration.lastSyncAt,
    lastSyncStatus: integration.lastSyncStatus,
  });
}

export async function DELETE() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  await prisma.whatsAppIntegration.deleteMany({ where: { ownerId } });
  return NextResponse.json({ ok: true });
}
