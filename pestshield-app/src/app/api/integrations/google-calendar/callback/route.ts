import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient } from "@/lib/integrations/google-calendar/client";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

const STATE_COOKIE = "google_oauth_state";

function redirectWithStatus(request: Request, status: "connected" | "error", reason?: string) {
  // request.url ters proxy (LiteSpeed/Passenger) arkasında sunucunun kendi iç
  // adresini (ör. localhost:3000) yansıtabilir — public yönlendirme için her
  // zaman NEXTAUTH_URL kullanılır (bkz. client.ts getRedirectUri()).
  const base = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
  const url = new URL("/dashboard/client/integrations", base);
  url.searchParams.set("googleCalendar", status);
  if (reason) url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = await getCookieState(request);

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithStatus(request, "error", "state_mismatch");
  }

  const existing = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!existing?.clientId || !existing.clientSecretEnc) {
    return redirectWithStatus(request, "error", "not_configured");
  }

  try {
    const tokens = await googleCalendarClient.exchangeCode(code, existing.clientId, decryptSecret(existing.clientSecretEnc));

    await prisma.googleCalendarIntegration.update({
      where: { ownerId },
      data: {
        accessTokenEnc: encryptSecret(tokens.accessToken),
        // Google prompt=consent ile her seferinde yeni refresh_token döner; yine de gelmezse mevcut olanı koru.
        ...(tokens.refreshToken ? { refreshTokenEnc: encryptSecret(tokens.refreshToken) } : {}),
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        calendarId: existing.calendarId ?? "primary",
        connectedAt: new Date(),
      },
    });

    return redirectWithStatus(request, "connected");
  } catch {
    return redirectWithStatus(request, "error", "exchange_failed");
  }
}

async function getCookieState(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${STATE_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(STATE_COOKIE.length + 1)) : null;
}
