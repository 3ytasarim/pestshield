import { describe, expect, it } from "vitest";
import { comparePeriods, lastNMonthKeys, monthKeyOf, monthLabelOf, previousPeriodOf, safeRatio } from "@/lib/ai/analysis/period-comparison";

describe("comparePeriods", () => {
  it("normal artış için doğru yüzde ve yön hesaplar", () => {
    const r = comparePeriods(15, 10);
    expect(r.absoluteChange).toBe(5);
    expect(r.percentChange).toBe(50);
    expect(r.direction).toBe("up");
    expect(r.note).toBeNull();
  });

  it("azalış için doğru yön hesaplar", () => {
    const r = comparePeriods(8, 10);
    expect(r.direction).toBe("down");
    expect(r.percentChange).toBe(-20);
  });

  it("değişim yoksa 'flat' döner", () => {
    const r = comparePeriods(10, 10);
    expect(r.direction).toBe("flat");
    expect(r.percentChange).toBe(0);
  });

  it("önceki değer 0 ise yüzde hesaplamaz, yanıltıcı %∞ göstermez", () => {
    const r = comparePeriods(5, 0);
    expect(r.percentChange).toBeNull();
    expect(r.note).toMatch(/önceki dönemde kayıt bulunmadığı/i);
    expect(r.direction).toBe("up");
  });

  it("her ikisi de 0 ise 'flat' ve not döner", () => {
    const r = comparePeriods(0, 0);
    expect(r.percentChange).toBeNull();
    expect(r.direction).toBe("flat");
  });
});

describe("safeRatio", () => {
  it("payda 0 ise oranı null döndürür (bölme hatası yok)", () => {
    const r = safeRatio(5, 0);
    expect(r.ratioPercent).toBeNull();
  });

  it("normal oranı doğru hesaplar", () => {
    const r = safeRatio(3, 4);
    expect(r.ratioPercent).toBe(75);
  });
});

describe("previousPeriodOf", () => {
  it("aynı uzunlukta bir önceki dönemi hesaplar", () => {
    const prev = previousPeriodOf({ startDate: "2026-07-01", endDate: "2026-07-31" });
    expect(prev.startDate).toBe("2026-05-31");
    expect(prev.endDate).toBe("2026-06-30");
  });

  it("tek günlük dönem için önceki günü döndürür", () => {
    const prev = previousPeriodOf({ startDate: "2026-07-13", endDate: "2026-07-13" });
    expect(prev.startDate).toBe("2026-07-12");
    expect(prev.endDate).toBe("2026-07-12");
  });
});

describe("monthKeyOf / monthLabelOf", () => {
  it("ISO tarihten doğru ay anahtarı üretir", () => {
    expect(monthKeyOf("2026-07-13")).toBe("2026-07");
  });
  it("ay anahtarından Türkçe etiket üretir", () => {
    expect(monthLabelOf("2026-07")).toBe("Temmuz 2026");
  });
});

describe("lastNMonthKeys", () => {
  it("bugünü içeren ayla biten, sıralı N ay anahtarı üretir", () => {
    const keys = lastNMonthKeys("2026-07-13", 3);
    expect(keys).toEqual(["2026-05", "2026-06", "2026-07"]);
  });

  it("yıl sınırını doğru geçer", () => {
    const keys = lastNMonthKeys("2026-01-15", 3);
    expect(keys).toEqual(["2025-11", "2025-12", "2026-01"]);
  });
});
