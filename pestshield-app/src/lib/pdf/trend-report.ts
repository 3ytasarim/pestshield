// "Trend Analiz Raporu" — bir krokiye ait istasyonların aylık denetim verilerinden
// üretilen, A4 çok sayfalı PDF raporu. Yapı ve görsel stil, referans rapor
// şablonuyla birebir eşleşecek şekilde tasarlanmıştır (kapak sayfası, teal
// başlık bandı, Genel Özet, Denetçi Özeti, Risk Seviyesi, eksenli SVG
// grafikler, riskli nokta tabloları, detaylı karşılaştırma tabloları).
//
// NOT: Referans rapordaki "Kimyasal Kullanım Raporları" bölümü (etken madde
// bazlı aylık miktar/pasta grafiği) bilinçli olarak dahil edilmemiştir —
// PestShield veri modelinde biyosidal ürün kullanımı yalnızca serbest metin
// (biocidalProducts) olarak tutulur, yapılandırılmış etken madde/miktar kaydı
// yoktur. Böyle bir tabloyu gerçek veri olmadan uydurmak yerine, bu bölüm
// kullanıcıyla mutabık kalınarak kapsam dışı bırakılmıştır.

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow } from "@/lib/pdf/shared";
import { CHART_STYLES, renderLineChartSvg, renderStackedBarChartSvg, type ChartSeries } from "@/lib/pdf/chart-svg";
import { getCompanySettings } from "@/lib/company-settings";
import type { RiskyStationRow, TrendAnalysis } from "@/lib/trend-analysis";
import type { Customer } from "@/lib/mock/crm";

const TUR_PALETTE = ["#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f59e0b", "#64748b"];

function docNo(): string {
  const stamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  return `${stamp}`;
}

function typeLabelFor(type: string): string {
  return { zehirli: "Zehirli İstasyon", zehirsiz: "Zehirsiz İstasyon", ic_uckun: "İç Alan Uçkun İstasyon", dis_uckun: "Dış Alan Uçkun İstasyon" }[type] ?? type;
}

function toneClass(tone: "bad" | "good" | "neutral"): string {
  if (tone === "bad") return "tone-bad";
  if (tone === "good") return "tone-good";
  return "";
}

function riskyStationsTableHtml(title: string, rows: RiskyStationRow[]): string {
  return `
  <div class="risky-block">
    <p class="risky-title">${escapeHtml(title)}</p>
    <table>
      <thead><tr><th>İstasyon No</th><th>Önceki Tarih</th><th>Son Tarih</th><th>Durum</th></tr></thead>
      <tbody>
        ${
          rows.length > 0
            ? rows.map((r) => `<tr><td><b>#${r.istasyonNo}</b></td><td>${formatDate(r.oncekiTarih)}</td><td>${formatDate(r.sonTarih)}</td><td class="risky-status">Riskli (2 Periyot Aktivite)</td></tr>`).join("")
            : `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Riskli istasyon bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>`;
}

function riskTopTableHtml(title: string, tur: string, rows: { periyotTarihi: string; istasyonNo: number; sayim: number }[]): string {
  return `
  <div class="risky-block">
    <p class="risky-title">${escapeHtml(title)}</p>
    <table>
      <thead><tr><th>Periyot Tarihi</th><th>İstasyon No</th><th>İstasyon Türü</th><th class="num">Sayım (Adet)</th></tr></thead>
      <tbody>
        ${
          rows.length > 0
            ? rows.map((r) => `<tr><td>${formatDate(r.periyotTarihi)}</td><td>${r.istasyonNo}</td><td>${escapeHtml(tur)}</td><td class="num">${r.sayim}</td></tr>`).join("")
            : Array.from({ length: 5 })
                .map(() => `<tr><td>---</td><td>---</td><td>${escapeHtml(tur)}</td><td class="num">---</td></tr>`)
                .join("")
        }
      </tbody>
    </table>
  </div>`;
}

function comparisonTableHtml(type: string, rows: NonNullable<TrendAnalysis["comparisonTables"][keyof TrendAnalysis["comparisonTables"]]>): string {
  const monthLabels = rows[0]?.cells.map((c) => c.monthLabel) ?? [];
  return `
  <div class="section-card">
    <p class="block-title">${escapeHtml(typeLabelFor(type))} — Detaylı Karşılaştırma</p>
    <table>
      <thead><tr><th>İstasyon No</th>${monthLabels.map((m) => `<th>${escapeHtml(m)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr><td class="cmp-no"><b>#${row.istasyonNo}</b></td>${row.cells
              .map(
                (c) =>
                  `<td><div class="cmp-date">${formatDate(c.occurrenceDate)}</div><div class="cmp-primary ${toneClass(c.tone)}">${escapeHtml(c.primary)}</div>${c.secondary ? `<div class="cmp-secondary">${escapeHtml(c.secondary)}</div>` : ""}</td>`,
              )
              .join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`;
}

export async function printTrendAnalysisReport(analysis: TrendAnalysis, customer: Customer, serviceName: string) {
  const a = analysis;
  const latestMonth = a.months.at(-1)!;
  const reportNo = docNo();
  const company = getCompanySettings();
  const periodLabel = latestMonth.monthKey;

  const zehirliCount = a.byTypeCounts.find((t) => t.type === "zehirli")?.count ?? 0;
  const zehirsizCount = a.byTypeCounts.find((t) => t.type === "zehirsiz")?.count ?? 0;
  const icUckunCount = a.byTypeCounts.find((t) => t.type === "ic_uckun")?.count ?? 0;

  // Renk şeması referans rapor ile birebir: Var = yeşil, Yok = gri, Kırık/Kayıp = kırmızı
  // (istasyonda hareket/tüketim TESPİT EDİLMESİ ayrı bir uyarı katmanında — kritik/riskli
  // noktalar tablosunda — ele alınır; bu grafikte Kırık/Kayıp durumu asıl "kötü" renktir).
  const zehirliSeriesSvg: ChartSeries[] = [
    { name: "Yem Tüketimi Yok", color: "#cbd5e1", values: a.zehirliSeries.map((m) => m["Yem Tüketimi Yok"]) },
    { name: "İstasyon Kırık / Kayıp", color: "#dc2626", values: a.zehirliSeries.map((m) => m["İstasyon Kırık / Kayıp"]) },
    { name: "Yem Tüketimi Var", color: "#16a34a", values: a.zehirliSeries.map((m) => m["Yem Tüketimi Var"]) },
  ];
  const zehirsizSeriesSvg: ChartSeries[] = [
    { name: "Hareket Yok", color: "#cbd5e1", values: a.zehirsizSeries.map((m) => m["Hareket Yok"]) },
    { name: "İstasyon Kırık / Kayıp", color: "#dc2626", values: a.zehirsizSeries.map((m) => m["İstasyon Kırık / Kayıp"]) },
    { name: "Hareket Var", color: "#16a34a", values: a.zehirsizSeries.map((m) => m["Hareket Var"]) },
  ];
  const icUckunSeriesSvg: ChartSeries[] = a.icUckunTurKeys.map((tur, i) => ({
    name: tur,
    color: TUR_PALETTE[i % TUR_PALETTE.length],
    values: a.icUckunSeries.map((m) => Number(m[tur]) || 0),
  }));
  const uckunTrendSeriesSvg: ChartSeries[] = [
    { name: "İç Sayım", color: "#16a34a", values: a.uckunSayimTrend.map((m) => m["İç Alan"]) },
    { name: "Dış Sayım", color: "#ea580c", values: a.uckunSayimTrend.map((m) => m["Dış Alan"]) },
  ];

  const icUckunLatestTotal = a.uckunSayimTrend.at(-1)?.["İç Alan"] ?? 0;
  const icUckunPrevTotal = a.uckunSayimTrend.length > 1 ? a.uckunSayimTrend.at(-2)!["İç Alan"] : null;
  const icUckunDiffText =
    icUckunPrevTotal === null
      ? "Kıyaslama için en az 2 periyot verisi gerekir."
      : icUckunLatestTotal === icUckunPrevTotal
        ? `Son periyottaki toplam iç alan uçkun sayımı ${icUckunLatestTotal}, önceki periyotla aynı.`
        : `Son periyottaki toplam iç alan uçkun sayımı ${icUckunLatestTotal}, önceki periyotta ${icUckunPrevTotal}; ${Math.abs(icUckunLatestTotal - icUckunPrevTotal)} adet ${icUckunLatestTotal > icUckunPrevTotal ? "artış" : "azalış"} vardır.`;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Trend Analizi Raporu — ${escapeHtml(customer.companyName)}</title>
<style>
  ${LETTERHEAD_STYLES}
  ${CHART_STYLES}

  .cover-page { min-height: 90vh; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
  .cover-title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
  .cover-period { font-size: 13px; color: #94a3b8; margin: 4px 0 26px; }
  .cover-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; }
  .cover-card-name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .cover-card-line { font-size: 11px; color: #64748b; margin: 1px 0; }
  .cover-logos { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-top: 20px; }
  .cover-logo-company { max-height: 96px; max-width: 260px; object-fit: contain; }
  .cover-logo-customer { max-height: 44px; max-width: 140px; object-fit: contain; }

  .meta-bar { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; margin-top: 4px; font-size: 10.5px; color: #64748b; }
  .meta-bar b { color: #334155; }

  .teal-banner { margin-top: 16px; border-radius: 14px; padding: 18px 22px; background: linear-gradient(135deg, #0d9488, #0891b2); color: #fff; }
  .teal-banner .tb-title { font-size: 18px; font-weight: 800; }
  .teal-banner .tb-sub { font-size: 11.5px; color: rgba(255,255,255,0.88); margin-top: 3px; }

  .section-card { margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; page-break-inside: avoid; }
  .section-card .block-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }
  .section-card .block-desc { font-size: 10.5px; color: #64748b; margin: -6px 0 10px; }

  .summary-text { font-size: 11.5px; color: #334155; line-height: 1.6; margin: 0 0 12px; }
  .pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
  .pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 12px; font-size: 10px; font-weight: 600; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }

  .stat-row { border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; padding: 10px 14px; margin-bottom: 8px; text-align: center; }
  .stat-row .stat-label { font-size: 9.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 3px; }
  .stat-row .stat-value { font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; }

  .teal-stat-grid { display: flex; gap: 12px; margin-top: 12px; }
  .teal-stat-card { flex: 1; border-radius: 12px; padding: 14px 16px; background: linear-gradient(135deg, #f0fdfa, #ecfeff); border: 1px solid #99f6e4; }
  .teal-stat-card .ts-label { font-size: 10px; color: #0f766e; font-weight: 600; margin: 0 0 4px; }
  .teal-stat-card .ts-value { font-size: 22px; font-weight: 800; color: #134e4a; margin: 0; }
  .teal-stat-card .ts-caption { font-size: 9.5px; color: #0f766e; opacity: 0.8; margin: 3px 0 0; }

  .definition-box { margin-top: 14px; border: 1px dashed #f59e0b; border-radius: 10px; background: #fffbeb; padding: 12px 15px; font-size: 10.5px; color: #78350f; line-height: 1.6; }
  .definition-box b { color: #78350f; }

  .auditor-box { border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; padding: 12px 15px; }
  .auditor-box ul { margin: 0; padding-left: 18px; }
  .auditor-box li { font-size: 11px; color: #334155; margin: 3px 0; }

  .note-block-amber { margin-top: 10px; border: 1px dashed #f59e0b; border-radius: 10px; background: #fffbeb; padding: 10px 14px; font-size: 10.5px; color: #78350f; }

  .risky-wrap { margin-top: 10px; border: 1px solid #fecaca; border-radius: 10px; background: #fef2f2; padding: 12px 14px; }
  .risky-title { font-size: 11px; font-weight: 700; color: #b91c1c; margin: 0 0 6px; }
  .risky-status { color: #b91c1c; font-weight: 700; font-size: 10.5px; }

  .top5-grid { display: flex; gap: 14px; margin-top: 4px; }
  .risky-block { flex: 1; min-width: 0; }

  .cmp-no { text-align: center; }
  .cmp-date { font-size: 8.5px; color: #94a3b8; text-align: center; }
  .cmp-primary { font-size: 11px; font-weight: 700; color: #0f172a; text-align: center; }
  .cmp-primary.tone-bad { color: #dc2626; }
  .cmp-primary.tone-good { color: #16a34a; }
  .cmp-secondary { font-size: 8.5px; color: #64748b; text-align: center; }

  @media print {
    .teal-banner, .pill, .stat-row, .teal-stat-card, .definition-box, .auditor-box, .note-block-amber, .risky-wrap { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-card { break-inside: avoid; }
  }
</style>
</head>
<body>

  <div class="cover-page">
    <p class="cover-title">Trend Analizi Raporu</p>
    <p class="cover-period">${escapeHtml(periodLabel)}</p>

    <div class="cover-card">
      <p class="cover-card-name">${escapeHtml(company.companyName || "—")}</p>
      ${company.address ? `<p class="cover-card-line">${escapeHtml(company.address)}</p>` : ""}
      ${company.phone ? `<p class="cover-card-line">${escapeHtml(company.phone)}</p>` : ""}
    </div>
    <div class="cover-card">
      <p class="cover-card-name">${escapeHtml(customer.companyName)}</p>
      <p class="cover-card-line">${escapeHtml(customer.addressLine)}${customer.district ? `, ${escapeHtml(customer.district)}` : ""}${customer.city ? ` / ${escapeHtml(customer.city)}` : ""}</p>
      ${customer.contactPhone ? `<p class="cover-card-line">${escapeHtml(customer.contactPhone)}</p>` : ""}
      <p class="cover-card-line">Hizmet: ${escapeHtml(serviceName)}</p>
    </div>

    ${
      company.logo || customer.logo
        ? `<div class="cover-logos">
      ${company.logo ? `<img class="cover-logo-company" src="${company.logo}" alt="${escapeHtml(company.companyName)}" />` : ""}
      ${customer.logo ? `<img class="cover-logo-customer" src="${customer.logo}" alt="${escapeHtml(customer.companyName)}" />` : ""}
    </div>`
        : ""
    }
  </div>

  <div class="meta-bar">
    <span>Rapor No: <b>${escapeHtml(reportNo)}</b></span>
    <span>Periyot Aralığı: <b>${escapeHtml(periodLabel)}</b></span>
    <span>Oluşturma Tarihi: <b>${formatDate(new Date().toISOString())} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</b></span>
  </div>

  <div class="teal-banner">
    <div class="tb-title">Trend Analizi Raporu</div>
    <div class="tb-sub">${escapeHtml(periodLabel)}</div>
  </div>

  <div class="section-card">
    <p class="block-title">Trend Analizi - Genel Özet</p>
    <p class="summary-text">İncelenen dönemde toplam <b>${a.totalStations}</b> istasyonda izleme yapılmıştır. İstasyonların <b>%${a.activeStationRatioLatest}</b>'inde aktivite tespit edilmiştir. Aktivitenin baskın grubu <b>${escapeHtml(a.topGroupLabel)}</b> (${escapeHtml(a.dominantTur ?? "N/A")}) olarak görülmüştür.</p>

    <div class="pill-row">
      <span class="pill">En Sık Görülen Grup: ${escapeHtml(a.topGroupLabel)}</span>
      <span class="pill">Baskın Tür: ${escapeHtml(a.dominantTur ?? "N/A")}</span>
    </div>

    <div class="stat-row"><p class="stat-label">Toplam İstasyon</p><p class="stat-value">${a.totalStations}</p></div>
    <div class="stat-row"><p class="stat-label">Aktif İstasyon Oranı</p><p class="stat-value">%${a.activeStationRatioLatest}</p></div>
    <div class="stat-row"><p class="stat-label">En Sık Görülen Grup</p><p class="stat-value">${escapeHtml(a.topGroupLabel)}</p></div>
    <div class="stat-row"><p class="stat-label">Baskın Tür</p><p class="stat-value">${escapeHtml(a.dominantTur ?? "N/A")}</p></div>
    <div class="stat-row"><p class="stat-label">Önceki Periyot Kıyas</p><p class="stat-value">${escapeHtml(a.previousComparisonText)}</p></div>

    <table style="margin-top:14px;">
      <thead><tr><th>Ay/Periyot</th><th class="num">Aktif Zehirsiz (%)</th><th class="num">Aktif Zehirli (%)</th></tr></thead>
      <tbody>
        ${a.activityRateSeries.map((m, i) => `<tr class="${i % 2 ? "alt" : ""}"><td>${escapeHtml(m.monthLabel)}</td><td class="num">${m["Aktif Zehirsiz (%)"]}</td><td class="num">${m["Aktif Zehirli (%)"]}</td></tr>`).join("")}
      </tbody>
    </table>

    <div class="teal-stat-grid">
      <div class="teal-stat-card">
        <p class="ts-label">Aktif Zehirsiz İstasyon Oranı</p>
        <p class="ts-value">%${a.activeZehirsizRatioLatest ?? 0}</p>
        <p class="ts-caption">Hareketlilik var / toplam zehirsiz</p>
      </div>
      <div class="teal-stat-card">
        <p class="ts-label">Aktif Zehirli İstasyon Oranı</p>
        <p class="ts-value">%${a.activeZehirliRatioLatest ?? 0}</p>
        <p class="ts-caption">Tüketim var / toplam zehirli</p>
      </div>
    </div>

    <div class="definition-box">
      <p style="margin:0 0 4px; font-weight:700;">Tanım ve Hesaplama Notu</p>
      <p style="margin:2px 0;">• <b>Aktif Zehirsiz İstasyon Oranı:</b> Hareketlilik var olarak işaretlenen zehirsiz istasyonların, toplam zehirsiz istasyonlara oranı.</p>
      <p style="margin:2px 0;">• <b>Aktif Zehirli İstasyon Oranı:</b> Tüketim var olarak işaretlenen zehirli istasyonların, toplam zehirli istasyonlara oranı.</p>
      <p style="margin:2px 0;">• <b>Aktiflik Oranı:</b> Bu iki oranın ortalaması.</p>
      <p style="margin:2px 0;">• <b>Önceki Periyot Kıyas:</b> Aylık ortalamalara göre aktiflik oranındaki artış/azalış.</p>
    </div>
  </div>

  <div class="section-card">
    <p class="block-title">Denetçi Özeti</p>
    <div class="auditor-box">
      <ul>
        <li>Trend analizi yapıldı.</li>
        <li>Önceki periyotla kıyaslandı.</li>
        <li>Düzeltici/önleyici faaliyet tanımlandı.</li>
        <li>Biyosidal Ürün Uygulaması değerlendirmesi planlandı.</li>
        <li>Kayıtların izlenebilirliği sağlandı.</li>
      </ul>
    </div>
  </div>

  <div class="section-card">
    <p class="block-title">Risk Seviyesi / Eşik Değerler</p>
    <table>
      <thead><tr><th>İstasyon Tipi</th><th>Normal</th><th>Uyarı</th><th>Kritik</th><th>Eşik Notu</th></tr></thead>
      <tbody>
        <tr><td>Zehirli İstasyon (Kemirgen)</td><td>---</td><td>---</td><td>---</td><td>Eşik değerler işletme risk değerlendirmesi ile belirlenecektir.</td></tr>
        <tr class="alt"><td>Zehirsiz İstasyon</td><td>---</td><td>---</td><td>---</td><td>Eşik değerler işletme risk değerlendirmesi ile belirlenecektir.</td></tr>
        <tr><td>İç Alan Uçkun</td><td>---</td><td>---</td><td>---</td><td>Eşik değerler işletme risk değerlendirmesi ile belirlenecektir.</td></tr>
        <tr class="alt"><td>Dış Alan Uçkun</td><td>---</td><td>---</td><td>---</td><td>Eşik değerler işletme risk değerlendirmesi ile belirlenecektir.</td></tr>
      </tbody>
    </table>
  </div>

  ${
    zehirliCount > 0
      ? `<div class="section-card">
    <p class="block-title">Zehirli İstasyon (${zehirliCount} Adet)</p>
    <p class="block-desc">Zaman serisi (ay) bazında tür ve hareketlilik dağılımı.</p>
    ${renderStackedBarChartSvg(a.zehirliSeries.map((m) => m.monthLabel), zehirliSeriesSvg)}
    <div class="note-block-amber">${escapeHtml(a.zehirliComparisonText)}</div>
    ${riskyStationsTableHtml("Zehirli İstasyon Riskli Noktalar", a.zehirliRiskyStations)}
  </div>`
      : ""
  }

  ${
    zehirsizCount > 0
      ? `<div class="section-card">
    <p class="block-title">Zehirsiz İstasyon (${zehirsizCount} Adet)</p>
    <p class="block-desc">Hareket var/yok ve tür dağılımı.</p>
    ${renderStackedBarChartSvg(a.zehirsizSeries.map((m) => m.monthLabel), zehirsizSeriesSvg)}
    <div class="note-block-amber">${escapeHtml(a.zehirsizComparisonText)}</div>
    ${riskyStationsTableHtml("Zehirsiz İstasyon Riskli Noktalar", a.zehirsizRiskyStations)}
  </div>`
      : ""
  }

  ${
    icUckunCount > 0
      ? `<div class="section-card">
    <p class="block-title">İç Alan Uçkun İstasyon</p>
    <p class="block-desc">Tür bazlı sayım (stacked) ve genel sayım.</p>
    ${renderStackedBarChartSvg(a.icUckunSeries.map((m) => String(m.monthLabel)), icUckunSeriesSvg)}
    <div class="note-block-amber">${escapeHtml(icUckunDiffText)}</div>
  </div>

  <div class="section-card">
    <p class="block-title">Uçkun Aktivitesi Trend Analizi (Dış Alan / İç Alan)</p>
    <p class="block-desc">Ay/Periyot bazında uçkun sayımı (adet).</p>
    ${renderLineChartSvg(a.uckunSayimTrend.map((m) => m.monthLabel), uckunTrendSeriesSvg)}
    <div class="note-block-amber">Dış alan uçkun istasyonlarında gözlemlenen artışlar, iç alan uçkun riskinin erken göstergesi olarak değerlendirilmekte ve bu doğrultuda önleyici tedbirler planlanmaktadır.</div>
  </div>

  <div class="section-card">
    <p class="block-title">İç Alan Uçkun İstasyonları Son Floresan Değişim Tarihi</p>
    <table>
      <thead><tr><th>İstasyon No</th><th>Son Değişim Tarihi</th><th>Kaç Gün Önce</th></tr></thead>
      <tbody>
        ${
          a.icUckunFlorasan.length > 0
            ? a.icUckunFlorasan.map((r, i) => `<tr class="${i % 2 ? "alt" : ""}"><td>#${r.istasyonNo}</td><td>${formatDate(r.sonDegisimTarihi)}</td><td>${r.kacGunOnce}</td></tr>`).join("")
            : `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>`
      : ""
  }

  ${
    a.riskTopIc.length > 0 || a.riskTopDis.length > 0
      ? `<div class="section-card">
    <p class="block-title">Risk Haritası / Önceliklendirme (Top 5 Uçkun)</p>
    <div class="top5-grid">
      ${riskTopTableHtml("İç Alan (Top 5)", "İç Alan", a.riskTopIc.map((r) => ({ periyotTarihi: r.periyotTarihi, istasyonNo: r.istasyonNo, sayim: r.sayim })))}
      ${riskTopTableHtml("Dış Alan (Top 5)", "Dış Alan", a.riskTopDis.map((r) => ({ periyotTarihi: r.periyotTarihi, istasyonNo: r.istasyonNo, sayim: r.sayim })))}
    </div>
  </div>`
      : ""
  }

  ${Object.entries(a.comparisonTables)
    .map(([type, rows]) => comparisonTableHtml(type, rows!))
    .join("")}

  <div class="section-card">
    <p class="block-title">Biyosidal Ürün Kullanım Kayıtları</p>
    <table>
      <thead><tr><th>Ay</th><th>Periyot Tarihi</th><th>Kullanılan Ürünler</th></tr></thead>
      <tbody>
        ${
          a.biocidalRecords.length > 0
            ? a.biocidalRecords.map((r) => `<tr><td>${escapeHtml(r.monthLabel)}</td><td>${formatDate(r.occurrenceDate)}</td><td>${escapeHtml(r.text)}</td></tr>`).join("")
            : `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>PestShield — Trend Analiz Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
