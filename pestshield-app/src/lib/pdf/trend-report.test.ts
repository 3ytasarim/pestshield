import { beforeEach, describe, expect, it, vi } from "vitest";
import { printTrendAnalysisReport } from "@/lib/pdf/trend-report";
import type { TrendAnalysis } from "@/lib/trend-analysis";
import type { Customer } from "@/lib/mock/crm";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

function buildFixture(): TrendAnalysis {
  const months = [
    { monthKey: "2026-04", monthLabel: "Nisan 2026", occurrenceId: "occ-1", occurrenceDate: "2026-04-15", inspections: {} },
    { monthKey: "2026-05", monthLabel: "Mayıs 2026", occurrenceId: "occ-2", occurrenceDate: "2026-05-19", inspections: {} },
  ];
  return {
    sketches: [],
    months,
    totalStations: 82,
    byTypeCounts: [
      { type: "zehirli", label: "Zehirli İstasyon", count: 38 },
      { type: "zehirsiz", label: "Zehirsiz İstasyon", count: 34 },
      { type: "ic_uckun", label: "İç Alan Uçkun", count: 9 },
      { type: "dis_uckun", label: "Dış Alan Uçkun", count: 1 },
    ],
    hasEnoughData: true,
    activeStationRatioLatest: 17,
    activeStationRatioPrevious: 16,
    previousComparisonText: "Önceki ay ortalamasına göre aktiflik oranı 1 puan arttı.",
    activeZehirsizRatioLatest: 0,
    zehirsizComparisonText: "Son periyottaki aktif zehirsiz istasyon oranı önceki periyoda göre değişmemiştir.",
    activeZehirliRatioLatest: 34,
    zehirliComparisonText: "Son periyottaki aktif zehirli istasyon oranı önceki periyoda göre %3 puan artmıştır.",
    zehirliRiskyStations: [{ krokiName: "Zemin Kat", istasyonNo: 6, oncekiTarih: "2026-04-15", sonTarih: "2026-05-19" }],
    zehirsizRiskyStations: [],
    topGroupLabel: "Kemirgen",
    dominantTur: null,
    activityRateSeries: [
      { monthLabel: "Nisan 2026", "Aktif Zehirsiz (%)": 0, "Aktif Zehirli (%)": 32 },
      { monthLabel: "Mayıs 2026", "Aktif Zehirsiz (%)": 0, "Aktif Zehirli (%)": 34 },
    ],
    zehirliSeries: [
      { monthLabel: "Nisan 2026", "Yem Tüketimi Var": 12, "Yem Tüketimi Yok": 26, "İstasyon Kırık / Kayıp": 0 },
      { monthLabel: "Mayıs 2026", "Yem Tüketimi Var": 13, "Yem Tüketimi Yok": 25, "İstasyon Kırık / Kayıp": 0 },
    ],
    zehirsizSeries: [
      { monthLabel: "Nisan 2026", "Hareket Var": 0, "Hareket Yok": 34, "İstasyon Kırık / Kayıp": 0 },
      { monthLabel: "Mayıs 2026", "Hareket Var": 0, "Hareket Yok": 34, "İstasyon Kırık / Kayıp": 0 },
    ],
    zehirsizTurDagilimi: [],
    icUckunSeries: [
      { monthLabel: "Nisan 2026", "Küçük Sinek": 9, Diğerleri: 1 },
      { monthLabel: "Mayıs 2026", "Küçük Sinek": 7, Diğerleri: 2 },
    ],
    icUckunTurKeys: ["Küçük Sinek", "Diğerleri"],
    uckunSayimTrend: [
      { monthLabel: "Nisan 2026", "İç Alan": 131, "Dış Alan": 0 },
      { monthLabel: "Mayıs 2026", "İç Alan": 124, "Dış Alan": 0 },
    ],
    icUckunFlorasan: [{ krokiName: "Zemin Kat", istasyonNo: 3, sonDegisimTarihi: "2026-03-01", kacGunOnce: 135 }],
    riskTopIc: [{ periyotTarihi: "2026-05-19", krokiName: "Zemin Kat", istasyonNo: 6, turLabel: "İç Alan", sayim: 23 }],
    riskTopDis: [],
    comparisonTables: {
      zehirli: [
        {
          stationId: "s1",
          krokiName: "Zemin Kat",
          istasyonNo: 1,
          cells: [
            { monthLabel: "Nisan 2026", occurrenceDate: "2026-04-15", primary: "Yem Tüketimi Yok", tone: "good" },
            { monthLabel: "Mayıs 2026", occurrenceDate: "2026-05-19", primary: "Yem Tüketimi Var", tone: "bad" },
          ],
        },
      ],
    },
    biocidalRecords: [],
  };
}

describe("printTrendAnalysisReport", () => {
  let capturedHtml = "";

  beforeEach(() => {
    capturedHtml = "";
    const printWindow = {
      document: {
        write: (html: string) => {
          capturedHtml = html;
        },
        close: () => {},
      },
      focus: () => {},
      print: () => {},
      addEventListener: () => {},
    };
    const mockWindow = {
      open: () => printWindow,
      location: { origin: "http://localhost" },
      localStorage: fakeLocalStorage(),
    };
    vi.stubGlobal("window", mockWindow);
  });

  it("kapak sayfası, teal başlık bandı ve tüm ana bölüm başlıklarını üretir", async () => {
    const customer = { companyName: "Pakiş İlaçlama Hizmetleri", addressLine: "İstasyon Mah.", district: "Tuzla", city: "İstanbul", contactPhone: "(532) 611-2075", logo: null } as unknown as Customer;

    await printTrendAnalysisReport(buildFixture(), customer, "Genel Zararlı Kontrolü");

    expect(capturedHtml).toContain('class="cover-page"');
    expect(capturedHtml).toContain('class="teal-banner"');
    expect(capturedHtml).toContain("Trend Analizi Raporu");
    expect(capturedHtml).toContain("Trend Analizi - Genel Özet");
    expect(capturedHtml).toContain("Denetçi Özeti");
    expect(capturedHtml).toContain("Risk Seviyesi / Eşik Değerler");
    expect(capturedHtml).toContain("Zehirli İstasyon (38 Adet)");
    expect(capturedHtml).toContain("Zehirsiz İstasyon (34 Adet)");
    expect(capturedHtml).toContain("İç Alan Uçkun İstasyon");
    expect(capturedHtml).toContain("Uçkun Aktivitesi Trend Analizi");
    expect(capturedHtml).toContain("Risk Haritası / Önceliklendirme (Top 5 Uçkun)");
    expect(capturedHtml).toContain("Pakiş İlaçlama Hizmetleri");
  });

  it("kimyasal kullanım raporları bölümünü İÇERMEZ (kapsam dışı, uydurma veri yok)", async () => {
    const customer = { companyName: "Test", addressLine: "", district: "", city: "", contactPhone: "", logo: null } as unknown as Customer;
    await printTrendAnalysisReport(buildFixture(), customer, "Test Hizmet");
    expect(capturedHtml).not.toContain("Kimyasal Kullanım Raporları");
  });

  it("riskli nokta olmayan tür için dürüstçe 'bulunamadı' mesajı gösterir", async () => {
    const customer = { companyName: "Test", addressLine: "", district: "", city: "", contactPhone: "", logo: null } as unknown as Customer;
    await printTrendAnalysisReport(buildFixture(), customer, "Test Hizmet");
    expect(capturedHtml).toContain("Riskli istasyon bulunamadı.");
  });

  it("gerçek analiz sayılarını (uydurma değil) rapor metnine yansıtır", async () => {
    const customer = { companyName: "Test", addressLine: "", district: "", city: "", contactPhone: "", logo: null } as unknown as Customer;
    await printTrendAnalysisReport(buildFixture(), customer, "Test Hizmet");
    expect(capturedHtml).toContain(">82<");
    expect(capturedHtml).toContain("%17");
    expect(capturedHtml).toContain("%34");
  });
});
