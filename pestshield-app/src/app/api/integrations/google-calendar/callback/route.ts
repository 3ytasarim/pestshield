import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient } from "@/lib/integrations/google-calendar/client";
import { encryptSecret } from "@/lib/crypto";

const STATE_COOKIE = "google_oauth_state";

function redirectWithStatus(request: Request, status: "connected" | "error", reason?: string) {
  const url = new URL("/dashboard/client/integrations", request.url);
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

  try {
    const tokens = await googleCalendarClient.exchangeCode(code);
    const existing = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });

    await prisma.googleCalendarIntegration.upsert({
      where: { ownerId },
      create: {
        ownerId,
        accessTokenEnc: encryptSecret(tokens.accessToken),
        refreshTokenEnc: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        calendarId: "primary",
        connectedAt: new Date(),
      },
      update: {
        accessTokenEnc: encryptSecret(tokens.accessToken),
        // Google prompt=consent ile her seferinde yeni refresh_token döner; yine de gelmezse mevcut olanı koru.
        ...(tokens.refreshToken ? { refreshTokenEnc: encryptSecret(tokens.refreshToken) } : {}),
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        calendarId: existing?.calendarId ?? "primary",
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
