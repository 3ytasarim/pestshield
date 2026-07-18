import { describe, expect, it } from "vitest";
import { computeAuditReadiness } from "@/lib/ai/analysis/audit-readiness";
import type { AiChecklistRecord } from "@/lib/ai/providers/data-provider";

function item(standard: string, status: AiChecklistRecord["status"]): AiChecklistRecord {
  return { id: `${standard}-${Math.random()}`, standard, status, reviewDate: "2026-07-01" };
}

describe("computeAuditReadiness", () => {
  it("checklist boşsa 'unavailable' döner ve skor üretmez, uydurmaz", () => {
    const result = computeAuditReadiness([]);
    expect(result.dataQuality.status).toBe("unavailable");
    expect(result.overallScorePercent).toBeNull();
    expect(result.factors).toEqual([]);
  });

  it("standarda göre faktörleri doğru gruplar ve skoru izlenebilir şekilde hesaplar", () => {
    const items: AiChecklistRecord[] = [
      item("haccp", "compliant"),
      item("haccp", "compliant"),
      item("haccp", "non_compliant"),
      item("brcgs", "compliant"),
    ];
    const result = computeAuditReadiness(items);
    const haccp = result.factors.find((f) => f.standard === "HACCP");
    expect(haccp).toBeDefined();
    expect(haccp!.compliant).toBe(2);
    expect(haccp!.nonCompliant).toBe(1);
    expect(haccp!.scorePercent).toBeCloseTo((2 / 3) * 100, 1);
    // Genel skor: toplam 3 uygun / 4 değerlendirilebilir madde
    expect(result.overallScorePercent).toBeCloseTo(75, 1);
    expect(result.dataQuality.status).toBe("complete");
  });

  it("not_applicable maddeler skora dahil edilmez", () => {
    const items: AiChecklistRecord[] = [item("iso22000", "compliant"), item("iso22000", "not_applicable"), item("iso22000", "not_applicable")];
    const result = computeAuditReadiness(items);
    expect(result.overallScorePercent).toBe(100);
  });

  it("resmi bir sertifikasyon sonucu olmadığını açıkça belirtir", () => {
    const result = computeAuditReadiness([item("haccp", "compliant")]);
    expect(result.disclaimer).toMatch(/sertifikasyon sonucu değildir/i);
    expect(result.scoreFormulaVersion).toBeTruthy();
  });

  it("uygunsuz/beklemede maddeleri eksik belge olarak işaretler", () => {
    const items: AiChecklistRecord[] = [item("fssc", "non_compliant"), item("fssc", "pending")];
    const result = computeAuditReadiness(items);
    expect(result.missingDocuments.length).toBe(2);
  });
});
