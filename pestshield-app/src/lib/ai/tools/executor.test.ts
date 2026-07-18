import { describe, expect, it } from "vitest";
import { executeAiTool } from "@/lib/ai/tools/executor";
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

class FakeAiDataProvider implements AiDataProvider {
  readonly name = "fake";
  constructor(
    private readonly fixtures: {
      occurrences?: AiServiceOccurrence[];
      invoices?: AiInvoiceRecord[];
      customers?: AiCustomerRecord[];
      risks?: AiRiskRecord[];
      allRisks?: AiRiskHistoryRecord[];
      correctiveActions?: AiCorrectiveActionRecord[];
      allCorrectiveActions?: AiCorrectiveActionHistoryRecord[];
      technicians?: AiTechnicianRecord[];
      checklistItems?: AiChecklistRecord[];
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
  async getCustomerBalance(customerId: string) {
    const c = (this.fixtures.customers ?? []).find((x) => x.customerId === customerId);
    return { balance: c?.pendingCollection ?? 0, isOverdue: (c?.pendingCollection ?? 0) > 0, overdueDays: (c?.pendingCollection ?? 0) > 0 ? 10 : 0 };
  }
  async getOpenRisks() {
    return this.fixtures.risks ?? [];
  }
  async getOpenCorrectiveActions() {
    return this.fixtures.correctiveActions ?? [];
  }
  async getTechnicians() {
    return this.fixtures.technicians ?? [];
  }
  async getAllRisks() {
    return this.fixtures.allRisks ?? [];
  }
  async getAllCorrectiveActions() {
    return this.fixtures.allCorrectiveActions ?? [];
  }
  async getChecklistItems() {
    return this.fixtures.checklistItems ?? [];
  }
}

function occ(overrides: Partial<AiServiceOccurrence> = {}): AiServiceOccurrence {
  return {
    occurrenceId: "occ-1",
    customerId: "cust-1",
    customerName: "ABC Gıda",
    serviceOrderId: "order-1",
    serviceName: "Aylık Kontrol",
    personnelName: "Ahmet Yılmaz",
    periodDate: TODAY,
    startTime: "09:00",
    endTime: "10:00",
    isCompleted: false,
    ...overrides,
  };
}

describe("executeAiTool — halüsinasyon koruması", () => {
  it("kayıt yoksa empty_state döner ve asla veri uydurmaz", async () => {
    const provider = new FakeAiDataProvider({ occurrences: [] });
    const result = await executeAiTool(provider, "get_services_by_date", { date: TODAY }, TODAY);
    expect(result.responseType).toBe("empty_state");
    expect(result.services).toBeUndefined();
    expect(result.source.recordCount).toBe(0);
  });

  it("get_overdue_payments sadece fatura verisini kullanır, servis verisini karıştırmaz", async () => {
    const provider = new FakeAiDataProvider({
      occurrences: [occ()],
      invoices: [{ invoiceNo: "F-1", customerId: "cust-1", customerName: "ABC Gıda", amount: 5000, dueDate: "2026-07-01", status: "overdue" }],
    });
    const result = await executeAiTool(provider, "get_overdue_payments", {}, TODAY);
    expect(result.responseType).toBe("payment_table");
    expect(result.payments).toHaveLength(1);
    expect(result.payments?.[0].amount).toBe(5000);
    expect(result.services).toBeUndefined();
  });
});

describe("executeAiTool — servis sorguları", () => {
  it("get_services_by_date sadece o tarihe ait servisleri döner", async () => {
    const provider = new FakeAiDataProvider({
      occurrences: [occ({ occurrenceId: "a", periodDate: "2026-07-14" }), occ({ occurrenceId: "b", periodDate: "2026-07-15" })],
    });
    const result = await executeAiTool(provider, "get_services_by_date", { date: "2026-07-14" }, TODAY);
    expect(result.responseType).toBe("service_list");
    expect(result.services).toHaveLength(1);
    expect(result.services?.[0].occurrenceId).toBe("a");
  });

  it("geçmiş tarihli, tamamlanmamış servisler 'gecikti' olarak işaretlenir", async () => {
    const provider = new FakeAiDataProvider({ occurrences: [occ({ periodDate: "2026-07-01", isCompleted: false })] });
    const result = await executeAiTool(provider, "get_overdue_services", {}, TODAY);
    expect(result.services?.[0].status).toBe("gecikti");
  });

  it("kayıt limiti (20) uygulanır ama gerçek toplam sayı source.recordCount'ta korunur", async () => {
    const occurrences = Array.from({ length: 25 }, (_, i) => occ({ occurrenceId: `occ-${i}`, periodDate: TODAY }));
    const provider = new FakeAiDataProvider({ occurrences });
    const result = await executeAiTool(provider, "get_services_by_date", { date: TODAY }, TODAY);
    expect(result.services).toHaveLength(20);
    expect(result.source.recordCount).toBe(25);
  });
});

describe("executeAiTool — müşteri arama ve aynı isim çakışması", () => {
  const customers: AiCustomerRecord[] = [
    { customerId: "c1", companyName: "ABC Gıda A.Ş.", sector: "Gıda", city: "İstanbul", status: "active", riskLevel: "low", pendingCollection: 0, contractEndDate: null, branchCount: 2 },
    { customerId: "c2", companyName: "ABC Gıda Lojistik", sector: "Lojistik", city: "Ankara", status: "active", riskLevel: "medium", pendingCollection: 1200, contractEndDate: null, branchCount: 1 },
  ];

  it("aynı isimle birden fazla müşteri eşleşirse clarification döner, rastgele birini seçmez", async () => {
    const provider = new FakeAiDataProvider({ customers });
    const result = await executeAiTool(provider, "get_customer_details", { customerName: "ABC" }, TODAY);
    expect(result.responseType).toBe("clarification");
    expect(result.candidates).toHaveLength(2);
  });

  it("tek eşleşme varsa doğrudan customer_card döner", async () => {
    const provider = new FakeAiDataProvider({ customers: [customers[0]] });
    const result = await executeAiTool(provider, "get_customer_details", { customerName: "ABC Gıda A.Ş." }, TODAY);
    expect(result.responseType).toBe("customer_card");
    expect(result.customer?.customerId).toBe("c1");
  });

  it("eşleşme yoksa empty_state döner", async () => {
    const provider = new FakeAiDataProvider({ customers });
    const result = await executeAiTool(provider, "get_customer_details", { customerName: "Bulunmayan Firma" }, TODAY);
    expect(result.responseType).toBe("empty_state");
  });
});

describe("executeAiTool — teknisyen programı", () => {
  it("teknisyen bulunamazsa empty_state döner", async () => {
    const provider = new FakeAiDataProvider({ technicians: [] });
    const result = await executeAiTool(provider, "get_technician_schedule", { technicianName: "Bilinmeyen", date: TODAY }, TODAY);
    expect(result.responseType).toBe("empty_state");
  });
});

// ---------------------------------------------------------------------------
// Faz 2 — operasyonel zeka katmanı
// ---------------------------------------------------------------------------

describe("executeAiTool — get_operational_intelligence_summary", () => {
  it("gerçek veriden KPI ve dönem karşılaştırması üretir, halüsinasyon yapmaz", async () => {
    const provider = new FakeAiDataProvider({
      occurrences: [occ({ periodDate: TODAY }), occ({ occurrenceId: "occ-2", periodDate: "2026-07-01", isCompleted: false })],
    });
    const result = await executeAiTool(provider, "get_operational_intelligence_summary", {}, TODAY);
    expect(result.responseType).toBe("operational_intelligence");
    expect(result.operationalIntelligence).toBeDefined();
    expect(result.operationalIntelligence!.kpis.length).toBeGreaterThan(0);
    expect(result.operationalIntelligence!.dataQuality.status).toBe("complete");
  });

  it("gecikmiş servis varsa alerts listesine ekler", async () => {
    const provider = new FakeAiDataProvider({ occurrences: [occ({ periodDate: "2026-07-01", isCompleted: false })] });
    const result = await executeAiTool(provider, "get_operational_intelligence_summary", {}, TODAY);
    expect(result.operationalIntelligence!.alerts.some((a) => a.includes("tarihi geçmiş"))).toBe(true);
  });
});

describe("executeAiTool — get_service_trend", () => {
  it("veri yoksa 'Bu analiz için yeterli veri bulunmuyor' mesajıyla empty_state döner", async () => {
    const provider = new FakeAiDataProvider({ occurrences: [] });
    const result = await executeAiTool(provider, "get_service_trend", { months: 3 }, TODAY);
    expect(result.responseType).toBe("empty_state");
    expect(result.message).toMatch(/yeterli veri bulunmuyor/i);
  });

  it("aylık trend grafiği ve kayıt sayısını doğru üretir", async () => {
    const provider = new FakeAiDataProvider({
      occurrences: [occ({ periodDate: TODAY }), occ({ occurrenceId: "occ-2", periodDate: TODAY })],
    });
    const result = await executeAiTool(provider, "get_service_trend", { months: 2 }, TODAY);
    expect(result.responseType).toBe("trend_analysis");
    expect(result.trendAnalysis!.chart.series[0].points.at(-1)!.value).toBe(2);
    expect(result.source.recordCount).toBe(2);
  });
});

describe("executeAiTool — compare_periods", () => {
  it("her iki dönem de boşsa 'Bu kriterlere uygun kayıt bulunamadı' döner", async () => {
    const provider = new FakeAiDataProvider({ occurrences: [] });
    const result = await executeAiTool(provider, "compare_periods", { metric: "services", startDate: "2026-07-01", endDate: "2026-07-13" }, TODAY);
    expect(result.responseType).toBe("empty_state");
  });

  it("servis sayısını iki eşit dönem arasında doğru karşılaştırır", async () => {
    const provider = new FakeAiDataProvider({
      occurrences: [occ({ periodDate: "2026-07-10" }), occ({ occurrenceId: "occ-2", periodDate: "2026-06-25" })],
    });
    const result = await executeAiTool(provider, "compare_periods", { metric: "services", startDate: "2026-07-01", endDate: "2026-07-13" }, TODAY);
    expect(result.responseType).toBe("period_comparison");
    expect(result.periodComparison!.delta.current).toBe(1);
    expect(result.periodComparison!.delta.previous).toBe(1);
  });
});

describe("executeAiTool — get_risk_intelligence_summary", () => {
  it("açık riskleri ve kategoriye göre dağılımı döndürür", async () => {
    const provider = new FakeAiDataProvider({
      risks: [{ id: "r1", title: "Kemirgen Riski", category: "biological", likelihood: 4, impact: 4, status: "critical", customerId: null, customerName: null, owner: "Ahmet" }],
      allRisks: [{ id: "r1", title: "Kemirgen Riski", category: "biological", likelihood: 4, impact: 4, status: "open", reviewDate: TODAY, customerId: null, customerName: null, owner: "Ahmet" }],
    });
    const result = await executeAiTool(provider, "get_risk_intelligence_summary", {}, TODAY);
    expect(result.responseType).toBe("risk_intelligence");
    expect(result.riskIntelligence!.criticalRisks).toHaveLength(1);
    expect(result.riskIntelligence!.distribution[0].category).toBe("biological");
  });
});

describe("executeAiTool — get_technician_performance_summary", () => {
  it("veri yoksa 'yeterli veri bulunmuyor' döner", async () => {
    const provider = new FakeAiDataProvider({ occurrences: [] });
    const result = await executeAiTool(provider, "get_technician_performance_summary", { startDate: "2026-07-01", endDate: TODAY }, TODAY);
    expect(result.responseType).toBe("empty_state");
  });

  it("teknisyen başına doğru tamamlanma oranı hesaplar", async () => {
    const provider = new FakeAiDataProvider({
      occurrences: [
        occ({ occurrenceId: "a", personnelName: "Ahmet Yılmaz", isCompleted: true, periodDate: "2026-07-05" }),
        occ({ occurrenceId: "b", personnelName: "Ahmet Yılmaz", isCompleted: false, periodDate: "2026-07-06" }),
      ],
    });
    const result = await executeAiTool(provider, "get_technician_performance_summary", { startDate: "2026-07-01", endDate: TODAY }, TODAY);
    expect(result.responseType).toBe("technician_intelligence");
    const row = result.technicianIntelligence!.rows[0];
    expect(row.assignedCount).toBe(2);
    expect(row.completedCount).toBe(1);
    expect(row.completionRatePercent).toBe(50);
  });
});

describe("executeAiTool — get_audit_readiness_summary", () => {
  it("checklist verisi yoksa 'desteklenmiyor' mesajı döner, skor uydurmaz", async () => {
    const provider = new FakeAiDataProvider({ checklistItems: [] });
    const result = await executeAiTool(provider, "get_audit_readiness_summary", {}, TODAY);
    expect(result.responseType).toBe("empty_state");
    expect(result.message).toMatch(/desteklenmiyor/i);
  });

  it("checklist verisi varsa izlenebilir bir skor formülüyle sonuç üretir", async () => {
    const provider = new FakeAiDataProvider({
      checklistItems: [
        { id: "1", standard: "haccp", status: "compliant", reviewDate: TODAY },
        { id: "2", standard: "haccp", status: "non_compliant", reviewDate: TODAY },
      ],
    });
    const result = await executeAiTool(provider, "get_audit_readiness_summary", {}, TODAY);
    expect(result.responseType).toBe("audit_intelligence");
    expect(result.auditIntelligence!.overallScorePercent).toBe(50);
    expect(result.auditIntelligence!.scoreFormulaVersion).toBeTruthy();
    expect(result.auditIntelligence!.disclaimer).toMatch(/sertifikasyon sonucu değildir/i);
  });
});

describe("executeAiTool — generate_operational_report", () => {
  it("yeterli veri yoksa rapor oluşturmaz, dürüstçe 'yeterli veri bulunmuyor' döner", async () => {
    const provider = new FakeAiDataProvider({ occurrences: [], invoices: [], allRisks: [] });
    const result = await executeAiTool(provider, "generate_operational_report", { scope: "company", months: 3 }, TODAY);
    expect(result.responseType).toBe("empty_state");
  });

  it("şirket geneli rapor için gerçek veriden KPI ve indirilebilir rapor verisi üretir", async () => {
    const provider = new FakeAiDataProvider({
      occurrences: [occ({ periodDate: TODAY, isCompleted: true })],
      invoices: [{ invoiceNo: "F-1", customerId: "c1", customerName: "ABC", amount: 2000, dueDate: TODAY, status: "overdue" }],
    });
    const result = await executeAiTool(provider, "generate_operational_report", { scope: "company", months: 3 }, TODAY);
    expect(result.responseType).toBe("report_result");
    expect(result.report!.status).toBe("completed");
    expect(result.report!.reportData).toBeDefined();
    expect(result.report!.pdfAvailable).toBe(true);
    expect(result.report!.excelAvailable).toBe(true);
  });

  it("belirsiz müşteri adı için clarification döner, LLM'in kendi başına seçim yapmasına izin vermez", async () => {
    const provider = new FakeAiDataProvider({
      customers: [
        { customerId: "c1", companyName: "ABC Gıda A.Ş.", sector: "Gıda", city: "İstanbul", status: "active", riskLevel: "low", pendingCollection: 0, contractEndDate: null, branchCount: 1 },
        { customerId: "c2", companyName: "ABC Gıda Lojistik", sector: "Lojistik", city: "Ankara", status: "active", riskLevel: "low", pendingCollection: 0, contractEndDate: null, branchCount: 1 },
      ],
    });
    const result = await executeAiTool(provider, "generate_operational_report", { scope: "customer", customerName: "ABC", months: 3 }, TODAY);
    expect(result.responseType).toBe("clarification");
  });
});
