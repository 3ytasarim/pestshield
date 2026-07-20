import "server-only";

// Google Calendar API v3 + OAuth2 için düşük seviyeli, framework'ten bağımsız
// istemci. Kaynak: https://developers.google.com/calendar/api/v3/reference
//
// Paraşüt'ten farklı olarak PestShield burada TEK bir paylaşımlı OAuth
// uygulaması olarak kayıtlıdır (GOOGLE_OAUTH_CLIENT_ID/SECRET), kiracı başına
// client id/secret YOK — bkz. prisma/schema.prisma GoogleCalendarIntegration
// yorumu. `access_type=offline&prompt=consent` her bağlantıda zorunludur,
// aksi halde Google refresh_token'ı yalnızca kullanıcının UYGULAMAYI İLK KEZ
// onayladığı anda döner.

const OAUTH_BASE = "https://oauth2.googleapis.com";
const AUTHORIZE_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const API_BASE = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

export interface GoogleTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  /** Tüm gün etkinlik — "YYYY-MM-DD" */
  startDate: string;
  endDate: string;
}

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

function getCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleCalendarConfigured(): boolean {
  return getCredentials() !== null;
}

function getRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3200";
  return `${base.replace(/\/$/, "")}/api/integrations/google-calendar/callback`;
}

/** Kullanıcının yönlendirileceği Google onay ekranı URL'i. `state`, callback'te CSRF doğrulaması için karşılaştırılır. */
function buildAuthorizeUrl(state: string): string {
  const credentials = getCredentials();
  if (!credentials) {
    throw new GoogleApiError("Google Calendar entegrasyonu yapılandırılmadı (GOOGLE_OAUTH_CLIENT_ID/SECRET eksik).", 500);
  }
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTHORIZE_BASE}?${params.toString()}`;
}

async function requestToken(params: Record<string, string>): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams(params);
  const res = await fetch(`${OAUTH_BASE}/token`, { method: "POST", body });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    throw new GoogleApiError(data?.error_description ?? data?.error ?? "Google yetkilendirme başarısız oldu.", res.status);
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

function exchangeCode(code: string): Promise<GoogleTokenResponse> {
  const credentials = getCredentials();
  if (!credentials) {
    throw new GoogleApiError("Google Calendar entegrasyonu yapılandırılmadı (GOOGLE_OAUTH_CLIENT_ID/SECRET eksik).", 500);
  }
  return requestToken({
    grant_type: "authorization_code",
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code,
    redirect_uri: getRedirectUri(),
  });
}

/** Google refresh_token'ı rotate ETMEZ — yenileme yanıtında dönmeyebilir, mevcut refresh_token saklanmaya devam eder. */
function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const credentials = getCredentials();
  if (!credentials) {
    throw new GoogleApiError("Google Calendar entegrasyonu yapılandırılmadı (GOOGLE_OAUTH_CLIENT_ID/SECRET eksik).", 500);
  }
  return requestToken({
    grant_type: "refresh_token",
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: refreshToken,
  });
}

async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${OAUTH_BASE}/revoke?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch {
    // Best-effort — bağlantı kaydı zaten yerelde siliniyor, revoke başarısız olsa da sorun değil.
  }
}

async function listCalendars(accessToken: string): Promise<GoogleCalendarListEntry[]> {
  const res = await fetch(`${API_BASE}/users/me/calendarList?minAccessRole=writer`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new GoogleApiError(data?.error?.message ?? "Google takvim listesi alınamadı.", res.status);
  }
  const items: Array<{ id: string; summary: string; primary?: boolean }> = data?.items ?? [];
  return items.map((item) => ({ id: item.id, summary: item.summary, primary: item.primary }));
}

/** `eventId` verilirse günceller (PUT), yoksa yeni etkinlik oluşturur (POST). */
async function upsertEvent(
  accessToken: string,
  calendarId: string,
  eventId: string | null,
  event: GoogleCalendarEventInput,
): Promise<{ id: string }> {
  const body = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: { date: event.startDate },
    end: { date: event.endDate },
  };
  const url = eventId
    ? `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
    : `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
  const res = await fetch(url, {
    method: eventId ? "PUT" : "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new GoogleApiError(data?.error?.message ?? "Google Takvim etkinliği yazılamadı.", res.status);
  }
  return { id: data.id };
}

/** 404 (zaten silinmiş) hatasını sessizce yutar — çağıran taraf her zaman "silindi" kabul edebilir. */
async function deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const data = await res.json().catch(() => null);
    throw new GoogleApiError(data?.error?.message ?? "Google Takvim etkinliği silinemedi.", res.status);
  }
}

export const googleCalendarClient = {
  buildAuthorizeUrl,
  exchangeCode,
  refreshAccessToken,
  revokeToken,
  listCalendars,
  upsertEvent,
  deleteEvent,
};
