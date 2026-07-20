import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarClient, isGoogleCalendarConfigured, GoogleApiError } from "@/lib/integrations/google-calendar/client";

const STATE_COOKIE = "google_oauth_state";

export async function GET() {
  const { error } = await requireClientOwner();
  if (error) return error;

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { message: "Google Calendar entegrasyonu yapılandırılmadı (GOOGLE_OAUTH_CLIENT_ID/SECRET eksik)." },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();

  try {
    const authorizeUrl = googleCalendarClient.buildAuthorizeUrl(state);
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
