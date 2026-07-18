import { describe, expect, it } from "vitest";
import { generateOperationalInsights } from "@/lib/ai/insights/insight-service";
import type {
  AiChecklistRecord,
  AiCorrectiveActionHistoryRecord,
  AiCorrectiveActionRecord,
  AiCustomerRecord,
  AiDataProvider,
  AiInvoiceRecord,
  AiRiskHistoryRecord,
  AiRiskRecord,
  AiServiceOccurrence,
  AiTechnicianRecord,
} from "@/lib/ai/providers/data-provider";

const TODAY = "2026-07-13";

class FakeProvider implements AiDataProvider {
  readonly name = "fake";
  constructor(
    private readonly fixtures: {
      occurrences?: AiServiceOccurrence[];
      invoices?: AiInvoiceRecord[];
      customers?: AiCustomerRecord[];
      risks?: AiRiskRecord[];
      correctiveActions?: AiCorrectiveActionRecord[];
    } = {},
  ) {}
  async getServiceOccurrences() {
    return this.fixtures.occurrences ?? [];
  }
  async getInvoices() {
    return this.fixtures.invoices ?? [];
  }
  async getCustomers() {
    return this.fixtures.customers ?? [];
  }
  async getCustomerBalance() {
    return { balance: 0, isOverdue: false, overdueDays: 0 };
  }
  async getOpenRisks() {
    return this.fixtures.risks ?? [];
  }
  async getOpenCorrectiveActions() {
    return this.fixtures.correctiveActions ?? [];
  }
  async getTechnicians(): Promise<AiTechnicianRecord[]> {
    return [];
  }
  async getAllRisks(): Promise<AiRiskHistoryRecord[]> {
    return [];
  }
  async getAllCorrectiveActions(): Promise<AiCorrectiveActionHistoryRecord[]> {
    return [];
  }
  async getChecklistItems(): Promise<AiChecklistRecord[]> {
    return [];
  }
}

function occ(overrides: Partial<AiServiceOccurrence>): AiServiceOccurrence {
  return {
    occurrenceId: "occ-1",
    customerId: "cust-1",
    customerName: "ABC Gıda",
    serviceOrderId: "order-1",
    serviceName: "Rutin Kontrol",
    personnelName: "Ahmet Yılmaz",
    periodDate: TODAY,
    startTime: "09:00",
    endTime: "10:00",
    isCompleted: false,
    ...overrides,
  };
}

describe("generateOperationalInsights", () => {
  it("veri boşsa hiçbir içgörü üretmez (zayıf kanıta dayalı sahte uyarı yok)", async () => {
    const provider = new FakeProvider();
    const insights = await generateOperationalInsights(provider, TODAY);
    expect(insights).toEqual([]);
  });

  it("gecikmiş servisleri gerçek veriden tespit eder ve kanıt gösterir", async () => {
    const provider = new FakeProvider({
      occurrences: [occ({ periodDate: "2026-07-01", isCompleted: false })],
    });
    const insights = await generateOperationalInsights(provider, TODAY);
    const overdue = insights.find((i) => i.type === "overdue_service");
    expect(overdue).toBeDefined();
    expect(overdue!.sourceRecordCount).toBe(1);
    expect(overdue!.evidence).toContain("1");
  });

  it("içgörüleri önem derecesine göre sıralar (critical/high önce)", async () => {
    const manyOverdue = Array.from({ length: 5 }, (_, i) => occ({ occurrenceId: `overdue-${i}`, periodDate: "2026-07-01", isCompleted: false }));
    const provider = new FakeProvider({
      occurrences: manyOverdue,
      risks: [{ id: "r1", title: "Kemirgen Riski", category: "biological", likelihood: 4, impact: 4, status: "critical", customerId: null, customerName: null, owner: "Ahmet" }],
    });
    const insights = await generateOperationalInsights(provider, TODAY);
    expect(insights[0].severity).toBe("critical");
  });

  it("en fazla 5 içgörü döndürür", async () => {
    const provider = new FakeProvider({
      occurrences: [occ({ periodDate: "2026-07-01", isCompleted: false }), occ({ occurrenceId: "occ-2", periodDate: TODAY, personnelName: "" })],
      invoices: [{ invoiceNo: "F-1", customerId: "c1", customerName: "X", amount: 1000, dueDate: "2026-07-01", status: "overdue" }],
      risks: [{ id: "r1", title: "Risk", category: "operational", likelihood: 4, impact: 4, status: "critical", customerId: null, customerName: null, owner: "A" }],
      correctiveActions: [{ id: "c1", title: "CAPA", severity: "high", status: "open", dueDate: "2026-07-01", customerId: null, customerName: null, responsible: "A", overdue: true }],
      customers: [{ customerId: "c1", companyName: "X", sector: "Gıda", city: "İstanbul", status: "active", riskLevel: "high", pendingCollection: 0, contractEndDate: "2026-07-20", branchCount: 1 }],
    });
    const insights = await generateOperationalInsights(provider, TODAY);
    expect(insights.length).toBeLessThanOrEqual(5);
  });

  it("her içgörü gezinme aksiyonu için güvenilir, önceden tanımlı bir route kullanır", async () => {
    const provider = new FakeProvider({ occurrences: [occ({ periodDate: "2026-07-01", isCompleted: false })] });
    const insights = await generateOperationalInsights(provider, TODAY);
    const overdue = insights.find((i) => i.type === "overdue_service");
    expect(overdue!.navigationAction?.href).toMatch(/^\/dashboard\//);
  });
});
