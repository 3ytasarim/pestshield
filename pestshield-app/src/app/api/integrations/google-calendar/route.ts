import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient } from "@/lib/integrations/google-calendar/client";
import { decryptSecret } from "@/lib/crypto";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  const hasCredentials = !!integration?.clientId;
  if (!integration || !integration.accessTokenEnc) {
    return NextResponse.json({ connected: false, hasCredentials, clientId: integration?.clientId ?? null });
  }

  return NextResponse.json({
    connected: true,
    hasCredentials,
    clientId: integration.clientId,
    calendarId: integration.calendarId,
    calendarName: integration.calendarName,
    connectedAt: integration.connectedAt,
    lastSyncAt: integration.lastSyncAt,
    lastSyncStatus: integration.lastSyncStatus,
    lastSyncCount: integration.lastSyncCount,
  });
}

export async function DELETE() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (integration?.refreshTokenEnc) {
    try {
      await googleCalendarClient.revokeToken(decryptSecret(integration.refreshTokenEnc));
    } catch {
      // Best-effort — kayıt zaten aşağıda silinecek.
    }
  }

  await prisma.googleCalendarIntegration.deleteMany({ where: { ownerId } });
  return NextResponse.json({ ok: true });
}
