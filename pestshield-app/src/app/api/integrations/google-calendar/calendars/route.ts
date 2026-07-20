import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient, GoogleApiError } from "@/lib/integrations/google-calendar/client";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!integration || !integration.accessTokenEnc) {
    return NextResponse.json({ message: "Google Calendar bağlantısı kurulmamış." }, { status: 400 });
  }

  try {
    let accessToken = decryptSecret(integration.accessTokenEnc);
    const expiresAt = integration.tokenExpiresAt?.getTime() ?? 0;
    if (expiresAt <= Date.now() + 60_000) {
      if (!integration.refreshTokenEnc) {
        return NextResponse.json({ message: "Bağlantının yenileme token'ı yok — yeniden bağlanmanız gerekiyor." }, { status: 400 });
      }
      const tokens = await googleCalendarClient.refreshAccessToken(decryptSecret(integration.refreshTokenEnc));
      accessToken = tokens.accessToken;
      await prisma.googleCalendarIntegration.update({
        where: { id: integration.id },
        data: {
          accessTokenEnc: encryptSecret(tokens.accessToken),
          ...(tokens.refreshToken ? { refreshTokenEnc: encryptSecret(tokens.refreshToken) } : {}),
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        },
      });
    }

    const calendars = await googleCalendarClient.listCalendars(accessToken);
    return NextResponse.json({ calendars });
  } catch (err) {
    const message = err instanceof GoogleApiError ? err.message : "Google takvim listesi alınamadı.";
    return NextResponse.json({ message }, { status: err instanceof GoogleApiError ? 400 : 500 });
  }
}
