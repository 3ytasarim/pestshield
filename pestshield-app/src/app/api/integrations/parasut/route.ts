import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const integration = await prisma.parasutIntegration.findUnique({ where: { ownerId } });
  if (!integration) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: !!integration.parasutCompanyId,
    pendingCompanySelection: !integration.parasutCompanyId,
    clientId: integration.clientId,
    companyName: integration.parasutCompanyName,
    connectedAt: integration.connectedAt,
    lastSyncAt: integration.lastSyncAt,
    lastSyncStatus: integration.lastSyncStatus,
    lastSyncCount: integration.lastSyncCount,
  });
}

export async function DELETE() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  await prisma.parasutIntegration.deleteMany({ where: { ownerId } });
  return NextResponse.json({ ok: true });
}
