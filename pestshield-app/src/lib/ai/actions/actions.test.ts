import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkActionPermission } from "@/lib/ai/actions/permissions";
import { getProposal, resetProposalForRetry, saveProposal, tryConsumeProposal } from "@/lib/ai/actions/proposal-store";
import { buildAssignTechnicianProposal, buildCreateServiceProposal, buildRescheduleServiceProposal, buildSendWhatsAppMessageProposal } from "@/lib/ai/actions/proposal-builder";
import { toE164, isValidE164 } from "@/lib/whatsapp/phone-normalizer";
import { customers } from "@/lib/mock/crm";
import { technicians } from "@/lib/mock/operations";
import { executeConfirmedAction, cancelProposal } from "@/lib/ai/actions/executors";
import { getAiActionAuditLog } from "@/lib/ai/actions/audit";
import type { AiActionProposal } from "@/lib/ai/actions/types";
import type { Customer, PeriyotOccurrence, ServiceOrder } from "@/lib/mock/crm";
import type { Technician } from "@/lib/mock/operations";
import type { AiToolResult } from "@/lib/ai/types";

// Gerçek seed verisi kullanılır (mock/crm.ts, mock/operations.ts) sadece SABİT
// FIXTURE olarak — resolvers.ts artık bu dizileri doğrudan okumuyor, gerçek
// backend'i taklit eden bir fetch() mock'u üzerinden (aşağıdaki
// `installFetchMock`) `/api/crm/*` uç noktalarına istek atıyor.
const CUSTOMER_ID = "cust-002"; // pad(i+1) varsayılan genişliği 3 (bkz. mock/crm.ts pad())
const CUSTOMER_NAME = "Marmara Gıda"; // tam adı "Marmara Gıda Üretim A.Ş." ile eşleşir
const TECHNICIAN_NAME = "Ahmet Yılmaz";
const TODAY = "2026-07-13";
const FUTURE_DATE = "2026-08-01";
const PAST_DATE = "2026-01-01";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

function serviceOrder(overrides: Partial<ServiceOrder> = {}): ServiceOrder {
  return {
    id: "order-marmara-1",
    customerId: CUSTOMER_ID,
    serviceNo: "HZM-2026-01",
    description: "Kemirgen Kontrol",
    contractStartDate: "2026-01-01",
    contractEndDate: "2027-01-01",
    assignedPersonnel: "",
    periodDays: 30,
    withholdingTax: "none",
    items: [],
    subtotal: 0,
    vatTotal: 0,
    withholdingAmount: 0,
    total: 0,
    approved: true,
    approvedAt: null,
    documentCount: 0,
    sketchCount: 0,
    contractFileDataUrl: null,
    contractFileName: null,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

function proposalOf(result: AiToolResult): AiActionProposal {
  if (result.responseType !== "action_proposal" || !result.proposal) {
    throw new Error(`Beklenen action_proposal, gelen: ${result.responseType} — ${result.message}`);
  }
  return result.proposal;
}

// ---------------------------------------------------------------------------
// Gerçek `/api/crm/*` ve `/api/operations/technicians` uç noktalarının yerine
// geçen, bellek-içi bir fetch() sahtesi — resolvers.ts/executors.ts'in
// tarayıcıda yapacağı isteklerin AYNISINI (yol + query + method + body)
// karşılar, gerçek bir Prisma/veritabanı olmadan aynı senaryoları test eder.
// ---------------------------------------------------------------------------
interface FakeOccurrence extends PeriyotOccurrence {
  customerId: string;
}

interface FakeBatch {
  id: string;
  serviceOrderId: string;
  name: string;
  donem: string;
  createdAt: string;
}

interface FakeState {
  customers: Customer[];
  technicians: Technician[];
  serviceOrders: ServiceOrder[];
  batches: FakeBatch[];
  occurrences: FakeOccurrence[];
}

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

function installFetchMock(state: FakeState) {
  let batchSeq = 0;
  let occSeq = 0;

  const handler = vi.fn(async (input: string | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname;
    const method = (init?.method ?? "GET").toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    if (path === "/api/crm/customers" && method === "GET") {
      return jsonResponse({ customers: state.customers });
    }
    if (path === "/api/operations/technicians" && method === "GET") {
      return jsonResponse({ technicians: state.technicians });
    }
    if (path === "/api/crm/service-orders" && method === "GET") {
      const customerId = url.searchParams.get("customerId");
      const list = customerId ? state.serviceOrders.filter((o) => o.customerId === customerId) : state.serviceOrders;
      return jsonResponse({ serviceOrders: list });
    }
    if (path === "/api/crm/periyot/batches/ensure-ai" && method === "POST") {
      const existing = state.batches.find((b) => b.serviceOrderId === body.serviceOrderId && b.name === "AI ile Oluşturulan Servisler");
      if (existing) return jsonResponse({ batch: existing });
      const batch: FakeBatch = { id: `batch-ai-${++batchSeq}`, serviceOrderId: body.serviceOrderId, name: "AI ile Oluşturulan Servisler", donem: "daily", createdAt: TODAY };
      state.batches.push(batch);
      return jsonResponse({ batch }, 201);
    }
    if (path === "/api/crm/periyot/occurrences" && method === "GET") {
      const customerId = url.searchParams.get("customerId");
      const batchId = url.searchParams.get("batchId");
      const periodDate = url.searchParams.get("periodDate");
      let list = state.occurrences;
      if (customerId) list = list.filter((o) => o.customerId === customerId);
      if (batchId) list = list.filter((o) => o.batchId === batchId);
      if (periodDate) list = list.filter((o) => o.periodDate === periodDate);
      return jsonResponse({ occurrences: list });
    }
    if (path === "/api/crm/periyot/occurrences" && method === "POST") {
      const occ: FakeOccurrence = {
        id: `occ-${++occSeq}`,
        batchId: body.batchId,
        serviceOrderId: body.serviceOrderId,
        customerId: body.customerId,
        personnelName: body.personnelName ?? "",
        periodDate: body.periodDate,
        startTime: body.startTime ?? "",
        endTime: body.endTime ?? "",
        documentCount: 0,
        biocidalProducts: "",
        biocidalProductUsages: [],
        createdAt: TODAY,
      };
      state.occurrences.push(occ);
      return jsonResponse({ occurrence: occ }, 201);
    }
    const occMatch = path.match(/^\/api\/crm\/periyot\/occurrences\/([^/]+)$/);
    if (occMatch && method === "GET") {
      const occ = state.occurrences.find((o) => o.id === occMatch[1]);
      return occ ? jsonResponse({ occurrence: occ }) : jsonResponse({ message: "not found" }, 404);
    }
    if (occMatch && method === "PATCH") {
      const occ = state.occurrences.find((o) => o.id === occMatch[1]);
      if (!occ) return jsonResponse({ message: "not found" }, 404);
      Object.assign(occ, body);
      return jsonResponse({ occurrence: occ });
    }

    throw new Error(`installFetchMock: unhandled request ${method} ${path}`);
  });

  vi.stubGlobal("fetch", handler);
}

function baseState(): FakeState {
  return {
    customers: customers.filter((c) => c.id === CUSTOMER_ID),
    technicians,
    serviceOrders: [],
    batches: [],
    occurrences: [],
  };
}

describe("Faz 3 — permissions", () => {
  it("TECH rolü yazma aksiyonlarından hariç tutulur, tam ret mesajıyla", () => {
    const result = checkActionPermission("create_service", "TECH");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz.");
  });

  it("ADMIN ve CLIENT rolleri izinlidir", () => {
    expect(checkActionPermission("create_service", "ADMIN").allowed).toBe(true);
    expect(checkActionPermission("create_service", "CLIENT").allowed).toBe(true);
  });
});

describe("Faz 3 — proposal-store idempotency ve yaşam döngüsü", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
  });

  it("tryConsumeProposal aynı öneriyi iki kez tüketemez", () => {
    const proposal: AiActionProposal = {
      id: "p1",
      actionType: "create_followup_task",
      status: "pending_confirmation",
      title: "t",
      description: "d",
      requestedBy: { userId: "u1", role: "ADMIN" },
      target: null,
      parameters: {},
      before: null,
      after: [],
      warnings: [],
      validation: { isValid: true, errors: [], warnings: [] },
      permissions: { allowed: true, requiredPermission: "task.create" },
      idempotencyKey: "p1",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    saveProposal("u1", proposal);

    const first = tryConsumeProposal("u1", "p1");
    expect(first?.status).toBe("executing");

    const second = tryConsumeProposal("u1", "p1");
    expect(second).toBeNull();
  });

  it("süresi dolmuş bir öneri okunduğunda otomatik 'expired' işaretlenir ve tüketilemez", () => {
    const expired: AiActionProposal = {
      id: "p2",
      actionType: "create_followup_task",
      status: "pending_confirmation",
      title: "t",
      description: "d",
      requestedBy: { userId: "u1", role: "ADMIN" },
      target: null,
      parameters: {},
      before: null,
      after: [],
      warnings: [],
      validation: { isValid: true, errors: [], warnings: [] },
      permissions: { allowed: true, requiredPermission: "task.create" },
      idempotencyKey: "p2",
      createdAt: new Date(Date.now() - 20 * 60_000).toISOString(),
      expiresAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    };
    saveProposal("u1", expired);

    expect(getProposal("u1", "p2")?.status).toBe("expired");
    expect(tryConsumeProposal("u1", "p2")).toBeNull();
  });

  it("resetProposalForRetry sadece 'failed' durumundaki öneriyi tekrar onaylanabilir yapar", () => {
    const completed: AiActionProposal = {
      id: "p3",
      actionType: "create_followup_task",
      status: "completed",
      title: "t",
      description: "d",
      requestedBy: { userId: "u1", role: "ADMIN" },
      target: null,
      parameters: {},
      before: null,
      after: [],
      warnings: [],
      validation: { isValid: true, errors: [], warnings: [] },
      permissions: { allowed: true, requiredPermission: "task.create" },
      idempotencyKey: "p3",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    saveProposal("u1", completed);
    expect(resetProposalForRetry("u1", "p3")?.status).toBe("completed"); // tamamlanmış öneri sıfırlanamaz

    const failed: AiActionProposal = { ...completed, id: "p4", status: "failed", errorMessage: "boom" };
    saveProposal("u1", failed);
    const reset = resetProposalForRetry("u1", "p4");
    expect(reset?.status).toBe("pending_confirmation");
    expect(reset?.errorMessage).toBeUndefined();
    expect(tryConsumeProposal("u1", "p4")?.status).toBe("executing");
  });

  it("cancelProposal yalnızca pending_confirmation durumundaki öneriyi iptal eder", () => {
    const pending: AiActionProposal = {
      id: "p5",
      actionType: "create_followup_task",
      status: "pending_confirmation",
      title: "t",
      description: "d",
      requestedBy: { userId: "u1", role: "ADMIN" },
      target: null,
      parameters: {},
      before: null,
      after: [],
      warnings: [],
      validation: { isValid: true, errors: [], warnings: [] },
      permissions: { allowed: true, requiredPermission: "task.create" },
      idempotencyKey: "p5",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    saveProposal("u1", pending);
    expect(cancelProposal("u1", "p5")?.status).toBe("cancelled");
    expect(tryConsumeProposal("u1", "p5")).toBeNull();
  });
});

describe("Faz 3 — create_service", () => {
  let state: FakeState;

  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
    state = baseState();
    state.serviceOrders.push(serviceOrder());
    installFetchMock(state);
  });

  it("var olan hizmet sözleşmesi altına geçerli bir öneri üretir ve onaylanınca gerçek bir servis kaydı oluşturur", async () => {
    const buildResult = await buildCreateServiceProposal(
      { customerName: CUSTOMER_NAME, date: FUTURE_DATE, startTime: "10:00", technicianName: TECHNICIAN_NAME },
      { userId: "u1", role: "ADMIN" },
      TODAY,
    );
    const proposal = proposalOf(buildResult);
    expect(proposal.status).toBe("pending_confirmation");
    expect(proposal.validation.isValid).toBe(true);
    expect(proposal.permissions.allowed).toBe(true);
    expect(state.occurrences).toHaveLength(0); // henüz hiçbir yazma olmadı

    const completed = await executeConfirmedAction("u1", "ADMIN", proposal.id);
    expect(completed?.status).toBe("completed");

    expect(state.occurrences).toHaveLength(1);
    expect(state.occurrences[0].periodDate).toBe(FUTURE_DATE);
    expect(state.occurrences[0].startTime).toBe("10:00");
    expect(state.occurrences[0].personnelName).toBe(TECHNICIAN_NAME);

    const auditEntries = getAiActionAuditLog("u1");
    expect(auditEntries[0].actionType).toBe("create_service");
    expect(auditEntries[0].resultStatus).toBe("completed");
  });

  it("aynı öneri iki kez onaylanırsa yalnızca bir kayıt oluşur (idempotency)", async () => {
    const proposal = proposalOf(await buildCreateServiceProposal({ customerName: CUSTOMER_NAME, date: FUTURE_DATE, startTime: "10:00" }, { userId: "u1", role: "ADMIN" }, TODAY));

    await executeConfirmedAction("u1", "ADMIN", proposal.id);
    await executeConfirmedAction("u1", "ADMIN", proposal.id); // ikinci "onay" — tıklama tekrarı simülasyonu

    expect(state.occurrences).toHaveLength(1);
  });

  it("geçmiş bir tarih reddedilir, yazma yapılmaz", async () => {
    const proposal = proposalOf(await buildCreateServiceProposal({ customerName: CUSTOMER_NAME, date: PAST_DATE, startTime: "10:00" }, { userId: "u1", role: "ADMIN" }, TODAY));
    expect(proposal.validation.isValid).toBe(false);
    expect(proposal.status).toBe("pending_confirmation"); // öneri hâlâ görüntülenir ama onaylanamaz olarak işaretli

    const result = await executeConfirmedAction("u1", "ADMIN", proposal.id);
    expect(result?.status).toBe("failed");
    expect(state.occurrences).toHaveLength(0);
  });

  it("TECH rolü izinsiz olduğu için onaylansa bile hiçbir kayıt oluşturulmaz", async () => {
    const proposal = proposalOf(await buildCreateServiceProposal({ customerName: CUSTOMER_NAME, date: FUTURE_DATE, startTime: "10:00" }, { userId: "u2", role: "TECH" }, TODAY));
    expect(proposal.permissions.allowed).toBe(false);

    const result = await executeConfirmedAction("u2", "TECH", proposal.id);
    expect(result?.status).toBe("failed");
    expect(result?.errorMessage).toBe("Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz.");
    expect(state.occurrences).toHaveLength(0);
  });

  it("hizmet sözleşmesi olmayan bir müşteri için servis oluşturulamaz, uydurma sözleşme üretilmez", async () => {
    state.customers.push(...customers.filter((c) => c.companyName.includes("Delta Depolama")));
    const result = await buildCreateServiceProposal({ customerName: "Delta Depolama", date: FUTURE_DATE, startTime: "10:00" }, { userId: "u1", role: "ADMIN" }, TODAY);
    expect(result.responseType).toBe("empty_state");
  });

  it("var olmayan bir müşteri adı için empty_state döner, tahmin edilmez", async () => {
    const result = await buildCreateServiceProposal({ customerName: "Bulunmayan Firma", date: FUTURE_DATE, startTime: "10:00" }, { userId: "u1", role: "ADMIN" }, TODAY);
    expect(result.responseType).toBe("empty_state");
  });
});

describe("Faz 3 — assign_technician çakışma tespiti", () => {
  let state: FakeState;

  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
    state = baseState();
    state.serviceOrders.push(serviceOrder());
    installFetchMock(state);
  });

  it("aynı teknisyen aynı gün çakışan saatte başka bir servise atanmışsa uyarı verir ama engellemez", async () => {
    state.occurrences.push(
      {
        id: "occ-existing",
        batchId: "batch-manual",
        serviceOrderId: "order-marmara-1",
        customerId: CUSTOMER_ID,
        personnelName: TECHNICIAN_NAME,
        periodDate: FUTURE_DATE,
        startTime: "09:30",
        endTime: "11:00",
        documentCount: 0,
        biocidalProducts: "",
        biocidalProductUsages: [],
        createdAt: TODAY,
      },
      {
        id: "occ-target",
        batchId: "batch-manual",
        serviceOrderId: "order-marmara-1",
        customerId: CUSTOMER_ID,
        personnelName: "",
        periodDate: FUTURE_DATE,
        startTime: "10:00",
        endTime: "11:00",
        documentCount: 0,
        biocidalProducts: "",
        biocidalProductUsages: [],
        createdAt: TODAY,
      },
    );

    const proposal = proposalOf(
      await buildAssignTechnicianProposal({ customerName: CUSTOMER_NAME, date: FUTURE_DATE, startTime: "10:00", technicianName: TECHNICIAN_NAME }, { userId: "u1", role: "ADMIN" }),
    );
    expect(proposal.validation.isValid).toBe(true); // çakışma engellemez, sadece uyarır
    expect(proposal.warnings.some((w) => w.includes("çakışan") || w.includes("başka bir servise"))).toBe(true);
  });

  it("bilinmeyen teknisyen adı doğrulama hatası üretir", async () => {
    state.occurrences.push({
      id: "occ-target",
      batchId: "batch-manual",
      serviceOrderId: "order-marmara-1",
      customerId: CUSTOMER_ID,
      personnelName: "",
      periodDate: FUTURE_DATE,
      startTime: "10:00",
      endTime: "11:00",
      documentCount: 0,
      biocidalProducts: "",
      biocidalProductUsages: [],
      createdAt: TODAY,
    });
    const proposal = proposalOf(
      await buildAssignTechnicianProposal({ customerName: CUSTOMER_NAME, date: FUTURE_DATE, startTime: "10:00", technicianName: "Olmayan Teknisyen" }, { userId: "u1", role: "ADMIN" }),
    );
    expect(proposal.validation.isValid).toBe(false);
  });
});

describe("Faz 3 — reschedule_service", () => {
  let state: FakeState;

  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
    state = baseState();
    state.serviceOrders.push(serviceOrder());
    state.occurrences.push({
      id: "occ-reschedule",
      batchId: "batch-manual",
      serviceOrderId: "order-marmara-1",
      customerId: CUSTOMER_ID,
      personnelName: TECHNICIAN_NAME,
      periodDate: FUTURE_DATE,
      startTime: "09:00",
      endTime: "10:00",
      documentCount: 0,
      biocidalProducts: "",
      biocidalProductUsages: [],
      createdAt: TODAY,
    });
    installFetchMock(state);
  });

  it("var olan bir servisi yeni tarih/saate taşır ve süresini korur", async () => {
    const proposal = proposalOf(
      await buildRescheduleServiceProposal({ customerName: CUSTOMER_NAME, currentDate: FUTURE_DATE, newDate: "2026-08-05", newStartTime: "14:00" }, { userId: "u1", role: "ADMIN" }, TODAY),
    );
    expect(proposal.validation.isValid).toBe(true);

    const result = await executeConfirmedAction("u1", "ADMIN", proposal.id);
    expect(result?.status).toBe("completed");

    const [occ] = state.occurrences;
    expect(occ.periodDate).toBe("2026-08-05");
    expect(occ.startTime).toBe("14:00");
    expect(occ.endTime).toBe("15:00"); // orijinal 1 saatlik süre korunur
  });

  it("geçmiş bir tarihe erteleme reddedilir", async () => {
    const proposal = proposalOf(await buildRescheduleServiceProposal({ customerName: CUSTOMER_NAME, currentDate: FUTURE_DATE, newDate: PAST_DATE, newStartTime: "14:00" }, { userId: "u1", role: "ADMIN" }, TODAY));
    expect(proposal.validation.isValid).toBe(false);
  });
});

describe("Faz 4 — send_whatsapp_message", () => {
  beforeEach(() => {
    installFetchMock(baseState());
  });

  it("alıcı numarası müşterinin kayıtlı telefonundan gelir ve E.164'e normalize edilir", async () => {
    const customer = customers.find((c) => c.id === CUSTOMER_ID)!;
    const expectedPhone = toE164(customer.contactPhone);
    expect(isValidE164(expectedPhone)).toBe(true);

    const proposal = proposalOf(
      await buildSendWhatsAppMessageProposal({ customerName: CUSTOMER_NAME, templateId: "service_appointment_reminder", serviceDate: FUTURE_DATE, serviceTime: "10:00" }, { userId: "u1", role: "ADMIN" }),
    );
    expect(proposal.status).toBe("pending_confirmation");
    expect((proposal.parameters as { recipientPhone: string }).recipientPhone).toBe(expectedPhone);
    // SMTP/WhatsApp yapılandırılmamış ortamda bile uydurma numara ÜRETİLMEZ — gerçek müşteri kaydından gelir.
  });

  it("geçersiz şablon adı doğrulama hatası üretir", async () => {
    const proposal = proposalOf(await buildSendWhatsAppMessageProposal({ customerName: CUSTOMER_NAME, templateId: "olmayan_sablon" }, { userId: "u1", role: "ADMIN" }));
    expect(proposal.validation.isValid).toBe(false);
  });

  it("TECH rolü izinsiz olduğu için öneri oluşsa bile onaylanamaz", async () => {
    const proposal = proposalOf(await buildSendWhatsAppMessageProposal({ customerName: CUSTOMER_NAME, templateId: "payment_reminder", amount: "1.000 ₺" }, { userId: "u2", role: "TECH" }));
    expect(proposal.permissions.allowed).toBe(false);
  });

  it("var olmayan müşteri için empty_state döner, telefon numarası uydurulmaz", async () => {
    const result = await buildSendWhatsAppMessageProposal({ customerName: "Bulunmayan Firma", templateId: "payment_reminder" }, { userId: "u1", role: "ADMIN" });
    expect(result.responseType).toBe("empty_state");
  });
});
