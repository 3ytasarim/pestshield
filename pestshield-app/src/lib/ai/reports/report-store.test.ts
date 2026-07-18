import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteReport, getReport, listReports, saveReport } from "@/lib/ai/reports/report-store";
import type { ReportMetadata } from "@/lib/ai/reports/types";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

function report(id: string, userId: string): ReportMetadata {
  return {
    id,
    userId,
    reportType: "operational_summary",
    title: `Rapor ${id}`,
    entityType: "company",
    entityId: null,
    entityName: null,
    dateFrom: "2026-01-01",
    dateTo: "2026-07-13",
    status: "completed",
    summary: "Özet",
    createdAt: new Date(2026, 0, 1).toISOString(),
    reportVersion: "operational-report-v1",
    sourceRecordCount: 10,
  };
}

describe("report-store", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
  });

  it("kullanıcı bazlı izole edilir — bir kullanıcının raporu diğerinde görünmez", () => {
    saveReport("user-a", report("r1", "user-a"));
    saveReport("user-b", report("r2", "user-b"));
    expect(listReports("user-a").map((r) => r.id)).toEqual(["r1"]);
    expect(listReports("user-b").map((r) => r.id)).toEqual(["r2"]);
  });

  it("aynı id ile tekrar kaydedilirse üzerine yazar, çoğaltmaz", () => {
    saveReport("user-a", report("r1", "user-a"));
    const updated = { ...report("r1", "user-a"), title: "Güncellenmiş" };
    saveReport("user-a", updated);
    const all = listReports("user-a");
    expect(all.length).toBe(1);
    expect(all[0].title).toBe("Güncellenmiş");
  });

  it("getReport belirli bir raporu id ile döndürür", () => {
    saveReport("user-a", report("r1", "user-a"));
    expect(getReport("user-a", "r1")?.id).toBe("r1");
    expect(getReport("user-a", "missing")).toBeNull();
  });

  it("deleteReport sadece belirtilen raporu kaldırır", () => {
    saveReport("user-a", report("r1", "user-a"));
    saveReport("user-a", report("r2", "user-a"));
    deleteReport("user-a", "r1");
    expect(listReports("user-a").map((r) => r.id)).toEqual(["r2"]);
  });
});
