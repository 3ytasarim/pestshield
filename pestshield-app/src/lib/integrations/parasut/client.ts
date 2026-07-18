import "server-only";

// Paraşüt (Türk muhasebe/faturalama SaaS'ı) REST API'sine karşı düşük seviyeli,
// framework'ten bağımsız istemci. Kaynak: https://apidocs.parasut.com
//
// - OAuth2 endpoint'leri (/oauth/*) API kök alan adında, kaynak endpoint'leri
//   (/v4/...) firma bazlı (company_id path segment'i) çalışır.
// - Rate limit: 10 istek / 10 saniye — sayfalama döngüsünde basit bir throttle
//   uygulanır.

const AUTH_BASE = "https://api.parasut.com";
const API_BASE = "https://api.parasut.com/v4";
export const PARASUT_OOB_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

export interface ParasutTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ParasutCompany {
  id: string;
  name: string;
}

export interface ParasutContact {
  id: string;
  name: string;
  address: string;
  taxNumber: string;
  taxOffice: string;
  email: string;
  city: string;
  district: string;
  phone: string;
  fax: string;
}

export class ParasutApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ParasutApiError";
  }
}

function buildAuthorizeUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: PARASUT_OOB_REDIRECT_URI,
    response_type: "code",
  });
  return `${AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

async function requestToken(params: Record<string, string>): Promise<ParasutTokenResponse> {
  const body = new URLSearchParams(params);
  const res = await fetch(`${AUTH_BASE}/oauth/token`, { method: "POST", body });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    throw new ParasutApiError(data?.error_description ?? data?.error ?? "Paraşüt yetkilendirme başarısız oldu.", res.status);
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

function exchangeCode(clientId: string, clientSecret: string, code: string): Promise<ParasutTokenResponse> {
  return requestToken({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: PARASUT_OOB_REDIRECT_URI,
  });
}

function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<ParasutTokenResponse> {
  return requestToken({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
}

async function getMe(accessToken: string): Promise<ParasutCompany[]> {
  const res = await fetch(`${API_BASE}/me?include=companies`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ParasutApiError(data?.errors?.[0]?.detail ?? "Paraşüt kullanıcı bilgisi alınamadı.", res.status);
  }
  const included: Array<{ id: string; type: string; attributes?: { name?: string } }> = data?.included ?? [];
  return included
    .filter((item) => item.type === "companies")
    .map((item) => ({ id: item.id, name: item.attributes?.name ?? `Firma ${item.id}` }));
}

interface ListContactsPage {
  contacts: ParasutContact[];
  totalPages: number;
}

async function listContactsPage(accessToken: string, companyId: string, page: number): Promise<ListContactsPage> {
  const params = new URLSearchParams({
    "filter[account_type]": "customer",
    "page[number]": String(page),
    "page[size]": "25",
  });
  const res = await fetch(`${API_BASE}/${companyId}/contacts?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ParasutApiError(data?.errors?.[0]?.detail ?? "Paraşüt müşteri listesi alınamadı.", res.status);
  }
  const items: Array<{ id: string; attributes: Record<string, string | null> }> = data?.data ?? [];
  const contacts = items.map((item) => ({
    id: item.id,
    name: item.attributes.name ?? "",
    address: item.attributes.address ?? "",
    taxNumber: item.attributes.tax_number ?? "",
    taxOffice: item.attributes.tax_office ?? "",
    email: item.attributes.email ?? "",
    city: item.attributes.city ?? "",
    district: item.attributes.district ?? "",
    phone: item.attributes.phone ?? "",
    fax: item.attributes.fax ?? "",
  }));
  return { contacts, totalPages: data?.meta?.total_pages ?? 1 };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Bir firmanın tüm müşteri (account_type=customer) kontaklarını, sayfalama + rate-limit throttle ile çeker. */
async function listAllContacts(accessToken: string, companyId: string): Promise<ParasutContact[]> {
  const all: ParasutContact[] = [];
  let page = 1;
  let totalPages = 1;
  let requestsSinceThrottle = 0;
  do {
    const result = await listContactsPage(accessToken, companyId, page);
    all.push(...result.contacts);
    totalPages = result.totalPages;
    page += 1;
    requestsSinceThrottle += 1;
    if (requestsSinceThrottle >= 8 && page <= totalPages) {
      await sleep(10_000);
      requestsSinceThrottle = 0;
    }
  } while (page <= totalPages);
  return all;
}

export const parasutClient = {
  buildAuthorizeUrl,
  exchangeCode,
  refreshAccessToken,
  getMe,
  listAllContacts,
};
