import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { parasutClient, ParasutApiError } from "@/lib/integrations/parasut/client";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("parasutClient.exchangeCode / refreshAccessToken", () => {
  it("posts authorization_code grant and returns parsed tokens", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ access_token: "at-1", refresh_token: "rt-1", expires_in: 7200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const tokens = await parasutClient.exchangeCode("client-id", "client-secret", "auth-code");

    expect(tokens).toEqual({ accessToken: "at-1", refreshToken: "rt-1", expiresIn: 7200 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.parasut.com/oauth/token");
    const body = init.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("client_id")).toBe("client-id");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("redirect_uri")).toBe("urn:ietf:wg:oauth:2.0:oob");

    vi.unstubAllGlobals();
  });

  it("posts refresh_token grant", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ access_token: "at-2", refresh_token: "rt-2", expires_in: 7200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await parasutClient.refreshAccessToken("client-id", "client-secret", "old-refresh");

    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("old-refresh");

    vi.unstubAllGlobals();
  });

  it("throws ParasutApiError on a failed token exchange", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "invalid_grant", error_description: "Code expired" }, false, 400)),
    );

    await expect(parasutClient.exchangeCode("id", "secret", "bad-code")).rejects.toThrow(ParasutApiError);

    vi.unstubAllGlobals();
  });
});

describe("parasutClient.getMe", () => {
  it("extracts companies from the included JSON:API array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: { id: "1", type: "users", attributes: { name: "Test User" } },
          included: [
            { id: "10", type: "companies", attributes: { name: "Pakiş İlaçlama" } },
            { id: "11", type: "companies", attributes: { name: "İkinci Firma" } },
          ],
        }),
      ),
    );

    const companies = await parasutClient.getMe("access-token");

    expect(companies).toEqual([
      { id: "10", name: "Pakiş İlaçlama" },
      { id: "11", name: "İkinci Firma" },
    ]);

    vi.unstubAllGlobals();
  });
});

describe("parasutClient.listAllContacts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("maps JSON:API contact attributes to camelCase fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: [
            {
              id: "100",
              attributes: {
                name: "ACME A.Ş.",
                address: "Test Adres",
                tax_number: "1234567890",
                tax_office: "Kadıköy",
                email: "info@acme.com",
                city: "İstanbul",
                district: "Kadıköy",
                phone: "05551112233",
                fax: "02121112233",
              },
            },
          ],
          meta: { total_pages: 1 },
        }),
      ),
    );

    const contacts = await parasutClient.listAllContacts("token", "company-1");

    expect(contacts).toEqual([
      {
        id: "100",
        name: "ACME A.Ş.",
        address: "Test Adres",
        taxNumber: "1234567890",
        taxOffice: "Kadıköy",
        email: "info@acme.com",
        city: "İstanbul",
        district: "Kadıköy",
        phone: "05551112233",
        fax: "02121112233",
      },
    ]);
  });

  it("paginates across multiple pages and aggregates results", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const pageMatch = /page%5Bnumber%5D=(\d+)/.exec(url);
      const page = pageMatch ? Number(pageMatch[1]) : 1;
      return jsonResponse({
        data: [{ id: String(page), attributes: { name: `Müşteri ${page}` } }],
        meta: { total_pages: 3 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = parasutClient.listAllContacts("token", "company-1");
    await vi.runAllTimersAsync();
    const contacts = await promise;

    expect(contacts.map((c) => c.id)).toEqual(["1", "2", "3"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
