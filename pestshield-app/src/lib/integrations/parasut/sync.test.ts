import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPrisma = {
  parasutIntegration: { findUnique: vi.fn(), update: vi.fn() },
  customer: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
};
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

const mockClient = {
  refreshAccessToken: vi.fn(),
  listAllContacts: vi.fn(),
};
vi.mock("./client", () => ({ parasutClient: mockClient }));

vi.mock("@/lib/crypto", () => ({
  encryptSecret: (s: string) => `enc(${s})`,
  decryptSecret: (s: string) => String(s).replace(/^enc\(/, "").replace(/\)$/, ""),
}));

const { syncParasutCustomers } = await import("./sync");

const OWNER_ID = "owner-1";

function baseIntegration(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "integration-1",
    ownerId: OWNER_ID,
    clientId: "client-id",
    clientSecretEnc: "enc(client-secret)",
    accessTokenEnc: "enc(access-token)",
    refreshTokenEnc: "enc(refresh-token)",
    tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    parasutCompanyId: "company-1",
    parasutCompanyName: "Test Firma",
    connectedAt: new Date(),
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncCount: 0,
    ...overrides,
  };
}

const CONTACT = {
  id: "parasut-100",
  name: "ACME A.Ş.",
  address: "Test Adres",
  taxNumber: "1234567890",
  taxOffice: "Kadıköy",
  email: "info@acme.com",
  city: "İstanbul",
  district: "Kadıköy",
  phone: "05551112233",
  fax: "",
};

describe("syncParasutCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when no integration exists", async () => {
    mockPrisma.parasutIntegration.findUnique.mockResolvedValue(null);

    const result = await syncParasutCustomers(OWNER_ID);

    expect(result).toEqual({ created: 0, updated: 0, error: "Paraşüt bağlantısı kurulmamış." });
  });

  it("reuses a non-expired access token without refreshing", async () => {
    mockPrisma.parasutIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockClient.listAllContacts.mockResolvedValue([]);
    mockPrisma.parasutIntegration.update.mockResolvedValue({});

    await syncParasutCustomers(OWNER_ID);

    expect(mockClient.refreshAccessToken).not.toHaveBeenCalled();
    expect(mockClient.listAllContacts).toHaveBeenCalledWith("access-token", "company-1");
  });

  it("refreshes the access token when expired, then syncs", async () => {
    mockPrisma.parasutIntegration.findUnique.mockResolvedValue(
      baseIntegration({ tokenExpiresAt: new Date(Date.now() - 1000) }),
    );
    mockClient.refreshAccessToken.mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresIn: 7200,
    });
    mockClient.listAllContacts.mockResolvedValue([]);
    mockPrisma.parasutIntegration.update.mockResolvedValue({});

    await syncParasutCustomers(OWNER_ID);

    expect(mockClient.refreshAccessToken).toHaveBeenCalledWith("client-id", "client-secret", "refresh-token");
    expect(mockClient.listAllContacts).toHaveBeenCalledWith("new-access-token", "company-1");
    expect(mockPrisma.parasutIntegration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accessTokenEnc: "enc(new-access-token)" }),
      }),
    );
  });

  it("creates a new customer for a contact never seen before", async () => {
    mockPrisma.parasutIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockClient.listAllContacts.mockResolvedValue([CONTACT]);
    mockPrisma.customer.findUnique.mockResolvedValue(null);
    mockPrisma.customer.create.mockResolvedValue({});
    mockPrisma.parasutIntegration.update.mockResolvedValue({});

    const result = await syncParasutCustomers(OWNER_ID);

    expect(mockPrisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: OWNER_ID,
          parasutContactId: "parasut-100",
          companyName: "ACME A.Ş.",
          taxNumber: "1234567890",
          accountCode: "PRS-parasut-100",
        }),
      }),
    );
    expect(result).toEqual({ created: 1, updated: 0 });
  });

  it("updates an existing customer matched by parasutContactId instead of creating a duplicate", async () => {
    mockPrisma.parasutIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockClient.listAllContacts.mockResolvedValue([CONTACT]);
    mockPrisma.customer.findUnique.mockResolvedValue({ id: "existing-customer-1", ownerId: OWNER_ID });
    mockPrisma.customer.update.mockResolvedValue({});
    mockPrisma.parasutIntegration.update.mockResolvedValue({});

    const result = await syncParasutCustomers(OWNER_ID);

    expect(mockPrisma.customer.create).not.toHaveBeenCalled();
    expect(mockPrisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "existing-customer-1" } }),
    );
    expect(result).toEqual({ created: 0, updated: 1 });
  });

  it("never touches a matched record owned by a different tenant", async () => {
    mockPrisma.parasutIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockClient.listAllContacts.mockResolvedValue([CONTACT]);
    mockPrisma.customer.findUnique.mockResolvedValue({ id: "someone-elses-customer", ownerId: "other-owner" });

    const result = await syncParasutCustomers(OWNER_ID);

    expect(mockPrisma.customer.update).not.toHaveBeenCalled();
    expect(mockPrisma.customer.create).not.toHaveBeenCalled();
    expect(result).toEqual({ created: 0, updated: 0 });
  });

  it("records a failed sync on the integration and returns the error", async () => {
    mockPrisma.parasutIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockClient.listAllContacts.mockRejectedValue(new Error("Paraşüt müşteri listesi alınamadı."));
    mockPrisma.parasutIntegration.update.mockResolvedValue({});

    const result = await syncParasutCustomers(OWNER_ID);

    expect(result.error).toBe("Paraşüt müşteri listesi alınamadı.");
    expect(mockPrisma.parasutIntegration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastSyncStatus: "error: Paraşüt müşteri listesi alınamadı." }),
      }),
    );
  });
});
