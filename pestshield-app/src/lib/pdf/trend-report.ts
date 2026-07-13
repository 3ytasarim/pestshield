// "Trend Analiz Raporu" — bir krokiye ait istasyonların aylık denetim verilerinden
// üretilen, A4 çok sayfalı, marka renklerine (teal-cyan gradient) uygun PDF raporu.

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import type { TrendAnalysis } from "@/lib/trend-analysis";
import type { Customer } from "@/lib/mock/crm";

function docNo(customer: Customer): string {
  const stamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  return `TREND-${customer.accountCode.replace("CARI-", "")}-${stamp}`;
}

function typeLabelFor(type: string): string {
  return { zehirli: "Zehirli İstasyon", zehirsiz: "Zehirsiz İstasyon", ic_uckun: "İç Alan Uçkun İstasyon", dis_uckun: "Dış Alan Uçkun İstasyon" }[type] ?? type;
}

function renderBars(months: { label: string; series: { label: string; color: string; value: number }[] }[], unit = ""): string {
  const max = Math.max(1, ...months.flatMap((m) => m.series.map((s) => s.value)));
  return `
  <div class="bar-chart">
    ${months
      .map(
        (m) => `
    <div class="bar-col">
      <div class="bar-stack">
        ${m.series
          .map(
            (s) => `<div class="bar-seg" style="height:${Math.round((s.value / max) * 100)}%; background:${s.color};" title="${escapeHtml(s.label)}: ${s.value}${unit}"></div>`,
          )
          .join("")}
      </div>
      <div class="bar-label">${escapeHtml(m.label)}</div>
    </div>`,
      )
      .join("")}
  </div>`;
}

function toneClass(tone: "bad" | "good" | "neutral"): string {
  if (tone === "bad") return "tone-bad";
  if (tone === "good") return "tone-good";
  return "";
}

export async function printTrendAnalysisReport(analysis: TrendAnalysis, customer: Customer, serviceName: string) {
  const a = analysis;
  const latestMonth = a.months.at(-1)!;
  const reportNo = docNo(customer);

  const legendZehirli = [
    { label: "Yem Tüketimi Var", color: "#dc2626" },
    { label: "Yem Tüketimi Yok", color: "#16a34a" },
    { label: "İstasyon Kırık / Kayıp", color: "#94a3b8" },
  ];
  const legendZehirsiz = [
    { label: "Hareket Var", color: "#dc2626" },
    { label: "Hareket Yok", color: "#16a34a" },
    { label: "İstasyon Kırık / Kayıp", color: "#94a3b8" },
  ];

  const zehirliBars = a.zehirliSeries.map((m) => ({
    label: m.monthLabel,
    series: legendZehirli.map((l) => ({ ...l, value: (m as unknown as Record<string, number>)[l.label] })),
  }));
  const zehirsizBars = a.zehirsizSeries.map((m) => ({
    label: m.monthLabel,
    series: legendZehirsiz.map((l) => ({ ...l, value: (m as unknown as Record<string, number>)[l.label] })),
  }));
  const uckunBars = a.uckunSayimTrend.map((m) => ({
    label: m.monthLabel,
    series: [
      { label: "İç Alan", color: "#16a34a", value: m["İç Alan"] },
      { label: "Dış Alan", color: "#ea580c", value: m["Dış Alan"] },
    ],
  }));
  const aktiflikBars = a.activityRateSeries.map((m) => ({
    label: m.monthLabel,
    series: [
      { label: "Aktif Zehirsiz (%)", color: "#0d9488", value: m["Aktif Zehirsiz (%)"] },
      { label: "Aktif Zehirli (%)", color: "#dc2626", value: m["Aktif Zehirli (%)"] },
    ],
  }));

  function riskTableHtml(title: string, rows: { periyotTarihi: string; krokiName: string; istasyonNo: number; sayim: number }[]): string {
    return `
    <div class="risk-block">
      <p class="risk-title">${escapeHtml(title)}</p>
      <table>
        <thead><tr><th>Periyot Tarihi</th><th>Kroki</th><th>İstasyon No</th><th class="num">Sayım (Adet)</th></tr></thead>
        <tbody>
          ${
            rows.length > 0
              ? rows.map((r) => `<tr><td>${formatDate(r.periyotTarihi)}</td><td>${escapeHtml(r.krokiName)}</td><td>#${r.istasyonNo}</td><td class="num">${r.sayim}</td></tr>`).join("")
              : `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Riskli istasyon bulunamadı.</td></tr>`
          }
        </tbody>
      </table>
    </div>`;
  }

  function comparisonTableHtml(type: string, rows: NonNullable<TrendAnalysis["comparisonTables"][keyof TrendAnalysis["comparisonTables"]]>): string {
    const monthLabels = rows[0]?.cells.map((c) => c.monthLabel) ?? [];
    return `
    <div class="section-block">
      <p class="block-title">${escapeHtml(typeLabelFor(type))} — Detaylı Karşılaştırma</p>
      <table>
        <thead><tr><th>Kroki</th><th>İstasyon No</th>${monthLabels.map((m) => `<th>${escapeHtml(m)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (row) => `<tr><td>${escapeHtml(row.krokiName)}</td><td><b>#${row.istasyonNo}</b></td>${row.cells
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

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Trend Analiz Raporu — ${escapeHtml(customer.companyName)}</title>
<style>
  ${LETTERHEAD_STYLES}
  .gradient-banner {
    margin-top: 22px;
    border-radius: 14px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #0d9488, #0891b2);
    color: #fff;
  }
  .gradient-banner .g-title { font-size: 16px; font-weight: 800; }
  .gradient-banner .g-sub { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px; }

  .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .kpi-box { flex: 1; min-width: 130px; border-radius: 10px; padding: 11px 13px; background: #f0fdfa; border: 1px solid #99f6e4; }
  .kpi-label { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #0f766e; margin: 0 0 3px; }
  .kpi-value { font-size: 13px; font-weight: 800; color: #134e4a; margin: 0; }

  .section-block { margin-top: 20px; page-break-inside: avoid; }
  .block-title { font-size: 12.5px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
  .block-desc { font-size: 10.5px; color: #64748b; margin: -4px 0 8px; }

  .bar-chart { display: flex; align-items: flex-end; gap: 10px; height: 120px; margin-top: 6px; padding: 0 4px; border-bottom: 1px solid #e2e8f0; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-width: 30px; }
  .bar-stack { width: 60%; max-width: 34px; height: 100px; display: flex; flex-direction: column-reverse; border-radius: 3px 3px 0 0; overflow: hidden; background: #f1f5f9; }
  .bar-seg { width: 100%; }
  .bar-label { font-size: 8.5px; color: #64748b; margin-top: 4px; text-align: center; }
  .legend-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: #475569; }
  .legend-swatch { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }

  .risk-grid { display: flex; gap: 14px; margin-top: 8px; }
  .risk-block { flex: 1; min-width: 0; }
  .risk-title { font-size: 10px; font-weight: 700; color: #64748b; margin: 0 0 5px; }

  .cmp-date { font-size: 8.5px; color: #94a3b8; }
  .cmp-primary { font-size: 11px; font-weight: 700; color: #0f172a; }
  .cmp-primary.tone-bad { color: #dc2626; }
  .cmp-primary.tone-good { color: #16a34a; }
  .cmp-secondary { font-size: 8.5px; color: #64748b; }

  @media print {
    .gradient-banner, .kpi-box, .bar-stack { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-block { break-inside: avoid; }
  }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Trend Analiz Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customer.companyName)}</p>
      <p class="party-line">${escapeHtml(customer.addressLine)}${customer.district ? `, ${escapeHtml(customer.district)}` : ""}${customer.city ? ` / ${escapeHtml(customer.city)}` : ""}</p>
      <p class="party-line">${escapeHtml(customer.contactPhone)}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Hizmet</p>
      <p class="party-name">${escapeHtml(serviceName)}</p>
      <p class="party-line">Krokiler: ${escapeHtml(a.sketches.map((s) => s.name).join(", ") || "—")}</p>
      <p class="party-line">İncelenen Ay: ${escapeHtml(latestMonth.monthLabel)}</p>
    </div>
  </div>

  <div class="gradient-banner">
    <div class="g-title">Trend Analizi — Genel Özet</div>
    <div class="g-sub">${a.months.length} aylık periyot verisi incelendi · En Sık Görülen Grup: ${escapeHtml(a.topGroupLabel)}${a.dominantTur ? ` · Baskın Tür: ${escapeHtml(a.dominantTur)}` : ""}</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Toplam İstasyon</p><p class="kpi-value">${a.totalStations}</p></div>
    <div class="kpi-box"><p class="kpi-label">Aktif İstasyon Oranı</p><p class="kpi-value">%${a.activeStationRatioLatest}</p></div>
    <div class="kpi-box"><p class="kpi-label">En Sık Görülen Grup</p><p class="kpi-value">${escapeHtml(a.topGroupLabel)}</p></div>
    <div class="kpi-box"><p class="kpi-label">Önceki Periyot Kıyası</p><p class="kpi-value">${escapeHtml(a.previousComparisonText)}</p></div>
  </div>

  <div class="section-block">
    <p class="block-title">Ay/Periyot Bazında Aktif İstasyon Oranı</p>
    ${renderBars(aktiflikBars, "%")}
    <div class="legend-row">
      <span class="legend-item"><span class="legend-swatch" style="background:#0d9488;"></span>Aktif Zehirsiz (%)</span>
      <span class="legend-item"><span class="legend-swatch" style="background:#dc2626;"></span>Aktif Zehirli (%)</span>
    </div>
  </div>

  ${
    zehirliBars.some((m) => m.series.some((s) => s.value > 0))
      ? `<div class="section-block">
    <p class="block-title">Zehirli İstasyon</p>
    <p class="block-desc">Zaman serisi (ay) bazında yem tüketimi dağılımı.</p>
    ${renderBars(zehirliBars)}
    <div class="legend-row">${legendZehirli.map((l) => `<span class="legend-item"><span class="legend-swatch" style="background:${l.color};"></span>${escapeHtml(l.label)}</span>`).join("")}</div>
  </div>`
      : ""
  }

  ${
    zehirsizBars.some((m) => m.series.some((s) => s.value > 0))
      ? `<div class="section-block">
    <p class="block-title">Zehirsiz İstasyon</p>
    <p class="block-desc">Hareket var/yok dağılımı.</p>
    ${renderBars(zehirsizBars)}
    <div class="legend-row">${legendZehirsiz.map((l) => `<span class="legend-item"><span class="legend-swatch" style="background:${l.color};"></span>${escapeHtml(l.label)}</span>`).join("")}</div>
  </div>`
      : ""
  }

  ${
    uckunBars.some((m) => m.series.some((s) => s.value > 0))
      ? `<div class="section-block">
    <p class="block-title">Uçkun Aktivitesi Trend Analizi (Dış Alan / İç Alan)</p>
    <p class="block-desc">Ay/Periyot bazında toplam uçkun sayımı (adet).</p>
    ${renderBars(uckunBars)}
    <div class="legend-row">
      <span class="legend-item"><span class="legend-swatch" style="background:#16a34a;"></span>İç Alan</span>
      <span class="legend-item"><span class="legend-swatch" style="background:#ea580c;"></span>Dış Alan</span>
    </div>
  </div>`
      : ""
  }

  ${
    a.riskTopIc.length > 0 || a.riskTopDis.length > 0
      ? `<div class="section-block">
    <p class="block-title">Risk Haritası / Önceliklendirme (Top 5 Uçkun)</p>
    <div class="risk-grid">
      ${riskTableHtml("İç Alan (Top 5)", a.riskTopIc)}
      ${riskTableHtml("Dış Alan (Top 5)", a.riskTopDis)}
    </div>
  </div>`
      : ""
  }

  ${Object.entries(a.comparisonTables)
    .map(([type, rows]) => comparisonTableHtml(type, rows!))
    .join("")}

  <div class="section-block">
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
    <span>PestShield AI — Trend Analiz Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
