import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPrisma = {
  googleCalendarIntegration: { findUnique: vi.fn(), update: vi.fn() },
  workOrder: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
};
vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

const mockClient = {
  refreshAccessToken: vi.fn(),
  upsertEvent: vi.fn(),
  deleteEvent: vi.fn(),
};
vi.mock("./client", () => ({ googleCalendarClient: mockClient }));

vi.mock("@/lib/crypto", () => ({
  encryptSecret: (s: string) => `enc(${s})`,
  decryptSecret: (s: string) => String(s).replace(/^enc\(/, "").replace(/\)$/, ""),
}));

const { syncWorkOrderToCalendar, syncUpcomingWorkOrders } = await import("./sync");

const OWNER_ID = "owner-1";

function baseIntegration(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "integration-1",
    ownerId: OWNER_ID,
    clientId: "gcal-client-id",
    clientSecretEnc: "enc(gcal-client-secret)",
    accessTokenEnc: "enc(access-token)",
    refreshTokenEnc: "enc(refresh-token)",
    tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    calendarId: "primary",
    calendarName: "Ana Takvim",
    connectedAt: new Date(),
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncCount: 0,
    ...overrides,
  };
}

function baseOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "order-1",
    ownerId: OWNER_ID,
    customerId: "customer-1",
    technicianId: "tech-1",
    orderNo: "IS-2026-001",
    serviceType: "Genel İlaçlama",
    plannedDate: "2026-08-01",
    completedDate: null,
    status: "planned",
    riskFinding: null,
    googleEventId: null,
    customer: { companyName: "ACME A.Ş.", addressLine: "Test Cad. No:1", district: "Kadıköy", city: "İstanbul" },
    technician: { name: "Ahmet Yılmaz" },
    ...overrides,
  };
}

describe("syncWorkOrderToCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok without touching the API when no calendar is connected", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(null);

    const result = await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(result).toEqual({ ok: true });
    expect(mockClient.upsertEvent).not.toHaveBeenCalled();
  });

  it("reuses a non-expired access token without refreshing", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder());
    mockClient.upsertEvent.mockResolvedValue({ id: "gcal-event-1" });
    mockPrisma.workOrder.update.mockResolvedValue({});
    mockPrisma.googleCalendarIntegration.update.mockResolvedValue({});

    await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(mockClient.refreshAccessToken).not.toHaveBeenCalled();
    expect(mockClient.upsertEvent).toHaveBeenCalledWith("access-token", "primary", null, expect.any(Object));
  });

  it("refreshes the access token when expired, then syncs", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(
      baseIntegration({ tokenExpiresAt: new Date(Date.now() - 1000) }),
    );
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder());
    mockClient.refreshAccessToken.mockResolvedValue({ accessToken: "new-access-token", expiresIn: 3600 });
    mockClient.upsertEvent.mockResolvedValue({ id: "gcal-event-1" });
    mockPrisma.workOrder.update.mockResolvedValue({});
    mockPrisma.googleCalendarIntegration.update.mockResolvedValue({});

    await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(mockClient.refreshAccessToken).toHaveBeenCalledWith("refresh-token", "gcal-client-id", "gcal-client-secret");
    expect(mockClient.upsertEvent).toHaveBeenCalledWith("new-access-token", "primary", null, expect.any(Object));
    // Google refresh_token yanıtta yoksa mevcut refreshTokenEnc korunmalı.
    expect(mockPrisma.googleCalendarIntegration.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accessTokenEnc: "enc(new-access-token)" }) }),
    );
    const updateCallData = mockPrisma.googleCalendarIntegration.update.mock.calls[0][0].data;
    expect(updateCallData.refreshTokenEnc).toBeUndefined();
  });

  it("creates/updates the event and writes the returned googleEventId onto the WorkOrder", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder({ googleEventId: "existing-event" }));
    mockClient.upsertEvent.mockResolvedValue({ id: "existing-event" });
    mockPrisma.workOrder.update.mockResolvedValue({});
    mockPrisma.googleCalendarIntegration.update.mockResolvedValue({});

    const result = await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(mockClient.upsertEvent).toHaveBeenCalledWith(
      "access-token",
      "primary",
      "existing-event",
      expect.objectContaining({ summary: "Genel İlaçlama — ACME A.Ş.", startDate: "2026-08-01", endDate: "2026-08-02" }),
    );
    expect(mockPrisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { googleEventId: "existing-event" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("deletes the calendar event and clears googleEventId when the work order is cancelled", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder({ status: "cancelled", googleEventId: "existing-event" }));
    mockClient.deleteEvent.mockResolvedValue(undefined);
    mockPrisma.workOrder.update.mockResolvedValue({});
    mockPrisma.googleCalendarIntegration.update.mockResolvedValue({});

    const result = await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(mockClient.deleteEvent).toHaveBeenCalledWith("access-token", "primary", "existing-event");
    expect(mockClient.upsertEvent).not.toHaveBeenCalled();
    expect(mockPrisma.workOrder.update).toHaveBeenCalledWith({
      where: { id: "order-1" },
      data: { googleEventId: null },
    });
    expect(result).toEqual({ ok: true });
  });

  it("does nothing for a cancelled work order that never had a calendar event", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder({ status: "cancelled", googleEventId: null }));
    mockPrisma.googleCalendarIntegration.update.mockResolvedValue({});

    const result = await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(mockClient.deleteEvent).not.toHaveBeenCalled();
    expect(mockPrisma.workOrder.update).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it("records a failed sync on the integration and returns ok:false without throwing", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder());
    mockClient.upsertEvent.mockRejectedValue(new Error("Google Takvim etkinliği yazılamadı."));
    mockPrisma.googleCalendarIntegration.update.mockResolvedValue({});

    const result = await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(result).toEqual({ ok: false, error: "Google Takvim etkinliği yazılamadı." });
    expect(mockPrisma.googleCalendarIntegration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastSyncStatus: "error: Google Takvim etkinliği yazılamadı." }),
      }),
    );
  });

  it("never syncs a work order belonging to a different tenant", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder({ ownerId: "other-owner" }));

    const result = await syncWorkOrderToCalendar(OWNER_ID, "order-1");

    expect(result).toEqual({ ok: false, error: "İş emri bulunamadı." });
    expect(mockClient.upsertEvent).not.toHaveBeenCalled();
  });
});

describe("syncUpcomingWorkOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when no calendar is connected", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(null);

    const result = await syncUpcomingWorkOrders(OWNER_ID);

    expect(result).toEqual({ synced: 0, error: "Google Calendar bağlantısı kurulmamış." });
  });

  it("syncs every upcoming, non-cancelled work order and reports the count", async () => {
    mockPrisma.googleCalendarIntegration.findUnique.mockResolvedValue(baseIntegration());
    mockPrisma.workOrder.findMany.mockResolvedValue([{ id: "order-1" }, { id: "order-2" }]);
    mockPrisma.workOrder.findUnique.mockResolvedValue(baseOrder());
    mockClient.upsertEvent.mockResolvedValue({ id: "gcal-event-1" });
    mockPrisma.workOrder.update.mockResolvedValue({});
    mockPrisma.googleCalendarIntegration.update.mockResolvedValue({});

    const result = await syncUpcomingWorkOrders(OWNER_ID);

    expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ownerId: OWNER_ID, status: { not: "cancelled" } }),
      }),
    );
    expect(result).toEqual({ synced: 2, error: undefined });
  });
});
