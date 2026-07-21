import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient, GoogleApiError } from "@/lib/integrations/google-calendar/client";

const STATE_COOKIE = "google_oauth_state";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const integration = await prisma.googleCalendarIntegration.findUnique({ where: { ownerId } });
  if (!integration?.clientId) {
    return NextResponse.json({ message: "Önce Client ID/Secret girip kaydedin." }, { status: 400 });
  }

  const state = crypto.randomUUID();

  try {
    const authorizeUrl = googleCalendarClient.buildAuthorizeUrl(state, integration.clientId);
    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (err) {
    const message = err instanceof GoogleApiError ? err.message : "Google Calendar yetkilendirme URL'i oluşturulamadı.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
