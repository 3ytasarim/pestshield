import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const integration = await prisma.smtpIntegration.findUnique({ where: { ownerId } });
  if (!integration) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    host: integration.host,
    port: integration.port,
    encryption: integration.encryption,
    username: integration.username,
    fromName: integration.fromName,
    fromEmail: integration.fromEmail,
    connectedAt: integration.connectedAt,
    lastSyncAt: integration.lastSyncAt,
    lastSyncStatus: integration.lastSyncStatus,
  });
}

export async function DELETE() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  await prisma.smtpIntegration.deleteMany({ where: { ownerId } });
  return NextResponse.json({ ok: true });
}
