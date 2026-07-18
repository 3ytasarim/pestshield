import { describe, expect, it } from "vitest";
import { parseTurkishDateExpression } from "@/lib/ai/date-parser";

// Sabit referans "şimdi": 2026-07-13 (Pazartesi), 12:00 İstanbul saati.
const NOW = new Date("2026-07-13T09:00:00.000Z");

describe("parseTurkishDateExpression", () => {
  it("'yarın' ifadesini doğru tarihe çözer", () => {
    const result = parseTurkishDateExpression("Yarın hangi servisler var?", NOW);
    expect(result).toEqual({ startDate: "2026-07-14", endDate: "2026-07-14", label: "yarın" });
  });

  it("'bugün' ifadesini doğru tarihe çözer", () => {
    const result = parseTurkishDateExpression("Bugün kimlerden ödeme bekleniyor?", NOW);
    expect(result?.startDate).toBe("2026-07-13");
    expect(result?.endDate).toBe("2026-07-13");
  });

  it("'dün' ifadesini doğru tarihe çözer", () => {
    const result = parseTurkishDateExpression("Dün kaç servis tamamlandı?", NOW);
    expect(result?.startDate).toBe("2026-07-12");
  });

  it("'bu hafta' Pazartesi-Pazar aralığını döner", () => {
    const result = parseTurkishDateExpression("Bu hafta hangi servisler var?", NOW);
    expect(result).toEqual({ startDate: "2026-07-13", endDate: "2026-07-19", label: "bu hafta" });
  });

  it("'gelecek hafta' bir sonraki Pazartesi-Pazar aralığını döner", () => {
    const result = parseTurkishDateExpression("Gelecek hafta planı nedir?", NOW);
    expect(result).toEqual({ startDate: "2026-07-20", endDate: "2026-07-26", label: "gelecek hafta" });
  });

  it("'bu ay' ayın tamamını döner", () => {
    const result = parseTurkishDateExpression("Bu ay kaç tahsilat yapıldı?", NOW);
    expect(result).toEqual({ startDate: "2026-07-01", endDate: "2026-07-31", label: "bu ay" });
  });

  it("'geçen ay' önceki ayın tamamını döner", () => {
    const result = parseTurkishDateExpression("Geçen ay ne kadar tahsilat yapıldı?", NOW);
    expect(result).toEqual({ startDate: "2026-06-01", endDate: "2026-06-30", label: "geçen ay" });
  });

  it("'önümüzdeki 7 gün' bugünden +7 günü döner", () => {
    const result = parseTurkishDateExpression("Önümüzdeki 7 gün içinde ne var?", NOW);
    expect(result).toEqual({ startDate: "2026-07-13", endDate: "2026-07-20", label: "önümüzdeki 7 gün" });
  });

  it("'önümüzdeki 30 gün' bugünden +30 günü döner", () => {
    const result = parseTurkishDateExpression("Önümüzdeki 30 gün", NOW);
    expect(result?.endDate).toBe("2026-08-12");
  });

  it("belirli bir gün+ay+yıl ifadesini çözer", () => {
    const result = parseTurkishDateExpression("14 Temmuz 2026 servislerini göster", NOW);
    expect(result).toEqual({ startDate: "2026-07-14", endDate: "2026-07-14", label: "2026-07-14" });
  });

  it("yıl belirtilmeyen gün+ay ifadesinde mevcut yılı varsayar", () => {
    const result = parseTurkishDateExpression("14 Temmuz servislerini göster", NOW);
    expect(result?.startDate).toBe("2026-07-14");
  });

  it("ay+yıl ifadesini (rapor dönemi) ayın tamamına çözer", () => {
    const result = parseTurkishDateExpression("Temmuz 2027 için müşteri trend raporu oluştur", NOW);
    expect(result).toEqual({ startDate: "2027-07-01", endDate: "2027-07-31", label: "temmuz 2027" });
  });

  it("tarih ifadesi içermeyen metinlerde null döner", () => {
    const result = parseTurkishDateExpression("Kritik riskleri göster", NOW);
    expect(result).toBeNull();
  });
});
