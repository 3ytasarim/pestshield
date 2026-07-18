import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateEscalations, ESCALATION_THRESHOLDS } from "@/lib/ai/alerts/escalation";
import { upsertAlert, getAlertById } from "@/lib/ai/alerts/alert-store";
import type { AlertInstance } from "@/lib/ai/alerts/types";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

function baseAlert(overrides: Partial<AlertInstance>): AlertInstance {
  const now = new Date().toISOString();
  return {
    id: "a1",
    ruleId: "rule-critical_risk",
    ruleCode: "critical_risk",
    ruleVersion: 1,
    category: "critical_risk",
    severity: "critical",
    title: "Kritik risk",
    description: "d",
    evidence: "e",
    sourceEntityType: null,
    sourceEntityId: null,
    relatedCustomerId: null,
    relatedCustomerName: null,
    relatedTechnicianName: null,
    navigationHref: null,
    firstDetectedAt: now,
    lastDetectedAt: now,
    occurrenceCount: 1,
    status: "active",
    acknowledgedBy: null,
    acknowledgedAt: null,
    dismissedBy: null,
    dismissedAt: null,
    snoozedUntil: null,
    resolvedAt: null,
    deduplicationKey: "k1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("Faz 4 — eskalasyon motoru", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
  });

  it("yeni tespit edilmiş kritik risk (2 saatten az) ESKALE EDİLMEZ", () => {
    upsertAlert(baseAlert({ id: "a1", firstDetectedAt: new Date().toISOString() }));
    const events = evaluateEscalations();
    expect(events).toHaveLength(0);
  });

  it(`${ESCALATION_THRESHOLDS.criticalRiskUnacknowledgedHours} saatten uzun süredir onaylanmamış kritik risk ADMIN'e eskale edilir`, () => {
    const old = new Date(Date.now() - (ESCALATION_THRESHOLDS.criticalRiskUnacknowledgedHours + 1) * 60 * 60 * 1000).toISOString();
    upsertAlert(baseAlert({ id: "a1", firstDetectedAt: old, status: "active" }));
    const events = evaluateEscalations();
    expect(events).toHaveLength(1);
    expect(events[0].targetRole).toBe("ADMIN");
  });

  it("onaylanmış (acknowledged) kritik risk artık eskale edilmez", () => {
    const old = new Date(Date.now() - (ESCALATION_THRESHOLDS.criticalRiskUnacknowledgedHours + 1) * 60 * 60 * 1000).toISOString();
    upsertAlert(baseAlert({ id: "a1", firstDetectedAt: old, status: "acknowledged" }));
    const events = evaluateEscalations();
    expect(events).toHaveLength(0);
  });

  it("aynı uyarı ikinci kez çalıştırıldığında TEKRAR eskale edilmez", () => {
    const old = new Date(Date.now() - (ESCALATION_THRESHOLDS.criticalRiskUnacknowledgedHours + 1) * 60 * 60 * 1000).toISOString();
    upsertAlert(baseAlert({ id: "a1", firstDetectedAt: old, status: "active" }));
    evaluateEscalations();
    const events = evaluateEscalations();
    expect(events).toHaveLength(0);
    expect(getAlertById("a1")?.description).toContain("[ESKALE EDİLDİ]");
  });

  it("dismissed durumundaki uyarı hiçbir zaman eskale edilmez", () => {
    const old = new Date(Date.now() - (ESCALATION_THRESHOLDS.criticalRiskUnacknowledgedHours + 1) * 60 * 60 * 1000).toISOString();
    upsertAlert(baseAlert({ id: "a1", firstDetectedAt: old, status: "dismissed" }));
    expect(evaluateEscalations()).toHaveLength(0);
  });
});
