// PestShield AI Command Center — Faz 2 "Operasyon Özet Raporu" PDF üreticisi.
//
// Mevcut rapor altyapısıyla (src/lib/pdf/shared.ts) aynı antetli kağıt
// deseni kullanılır — yeni bir PDF kütüphanesi EKLENMEZ (tarayıcının
// yazdırma diyaloğu ile "Farklı Kaydet → PDF" akışı, tüm uygulamadaki
// diğer raporlarla tutarlıdır).

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import type { AiChartSpec, AiDataQuality, AiExecutiveSummaryData, AiKpiItem, AiMetricDelta, AiRiskDistributionSlice } from "@/lib/ai/types";

/** Bu üretici sadece bu alanları kullanır — hem canlı rapor hem de persist edilmiş rapor geçmişi aynı şekli üretebilir. */
export interface AiOperationalReportPdfData {
  scope: "company" | "customer";
  entityName: string | null;
  period: { from: string; to: string };
  kpis: AiKpiItem[];
  serviceTrendChart: AiChartSpec;
  comparison: AiMetricDelta[];
  riskDistribution: AiRiskDistributionSlice[];
  dataQuality: AiDataQuality;
  sourceRecordCount: number;
}

function docNo(): string {
  const stamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  return `AIOPS-${stamp}`;
}

function renderBarChart(points: { label: string; value: number }[]): string {
  const max = Math.max(1, ...points.map((p) => p.value));
  return `
  <div class="bar-chart">
    ${points
      .map(
        (p) => `
    <div class="bar-col">
      <div class="bar-stack">
        <div class="bar-seg" style="height:${Math.round((p.value / max) * 100)}%; background:#0877b2;" title="${escapeHtml(p.label)}: ${p.value}"></div>
      </div>
      <div class="bar-label">${escapeHtml(p.label)}<br/><b>${p.value}</b></div>
    </div>`,
      )
      .join("")}
  </div>`;
}

function renderKpis(kpis: { label: string; value: string | number }[]): string {
  return `
  <div class="info-grid">
    ${kpis.map((k) => `<div class="info-box"><p class="info-label">${escapeHtml(k.label)}</p><p class="info-value">${escapeHtml(String(k.value))}</p></div>`).join("")}
  </div>`;
}

function renderExecutiveSummary(summary: AiExecutiveSummaryData | undefined): string {
  if (!summary) {
    return `<div class="note-block">Bu rapor için AI yönetici özeti oluşturulmadı — aşağıdaki bölümler doğrudan hesaplanmış verilerdir.</div>`;
  }
  return `
  <div class="section-label">Yönetici Özeti (AI)</div>
  <div class="note-block">
    <b>${escapeHtml(summary.headline)}</b>
    <p style="margin:8px 0 0;">${escapeHtml(summary.summary)}</p>
    ${summary.keyFindings.length > 0 ? `<p style="margin:10px 0 2px;font-weight:700;">Öne Çıkanlar</p><ul>${summary.keyFindings.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>` : ""}
    ${summary.recommendations.length > 0 ? `<p style="margin:10px 0 2px;font-weight:700;">AI Önerileri</p><ul>${summary.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>` : ""}
    ${summary.limitations.length > 0 ? `<p style="margin:10px 0 2px;font-weight:700;color:#94a3b8;">Veri Sınırlamaları</p><ul>${summary.limitations.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>` : ""}
  </div>`;
}

export function printAiOperationalReport(data: AiOperationalReportPdfData, meta: { title: string; executiveSummary?: AiExecutiveSummaryData }) {
  const reportNo = docNo();
  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(meta.title)}</title>
<style>
${LETTERHEAD_STYLES}
.bar-chart { display: flex; align-items: flex-end; gap: 10px; height: 160px; margin-top: 14px; padding: 0 4px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.bar-stack { width: 60%; height: 120px; display: flex; align-items: flex-end; }
.bar-seg { width: 100%; border-radius: 4px 4px 0 0; min-height: 2px; }
.bar-label { font-size: 9.5px; color: #64748b; margin-top: 6px; text-align: center; }
.disclaimer { font-size: 10px; color: #94a3b8; margin-top: 4px; font-style: italic; }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: meta.title, docNo: reportNo })}
  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Kapsam</p>
      <p class="party-name">${data.scope === "customer" ? escapeHtml(data.entityName ?? "—") : "Şirket Geneli"}</p>
      <p class="party-line">Dönem: ${formatDate(data.period.from)} – ${formatDate(data.period.to)}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Rapor Bilgisi</p>
      <p class="party-line">Kaynak kayıt sayısı: ${data.sourceRecordCount}</p>
      <p class="party-line">Veri kalitesi: ${escapeHtml(data.dataQuality.status)}</p>
    </div>
  </div>

  <div class="section-label">Genel Görünüm</div>
  ${renderKpis(data.kpis)}

  ${renderExecutiveSummary(meta.executiveSummary)}

  <div class="section-label">Aylık Servis Sayısı Trendi</div>
  ${renderBarChart(data.serviceTrendChart.series[0]?.points ?? [])}

  ${
    data.comparison.length > 0
      ? `<div class="section-label">Dönem Karşılaştırması</div>
  <div class="note-block">
    ${data.comparison
      .map((c) => `<p style="margin:4px 0;">${escapeHtml(c.label)}: <b>${c.current}</b> (önceki: ${c.previous}${c.percentChange !== null ? `, değişim: %${c.percentChange > 0 ? "+" : ""}${c.percentChange}` : ""})${c.note ? ` — ${escapeHtml(c.note)}` : ""}</p>`)
      .join("")}
  </div>`
      : ""
  }

  ${
    data.riskDistribution.length > 0
      ? `<div class="section-label">Risk Dağılımı (Kategoriye Göre)</div>
  <table>
    <thead><tr><th>Kategori</th><th class="num">Açık Kayıt Sayısı</th></tr></thead>
    <tbody>${data.riskDistribution.map((r, i) => `<tr class="${i % 2 ? "alt" : ""}"><td>${escapeHtml(r.category)}</td><td class="num">${r.count}</td></tr>`).join("")}</tbody>
  </table>`
      : ""
  }

  <p class="disclaimer">${data.dataQuality.limitations.length > 0 ? `Veri sınırlaması: ${escapeHtml(data.dataQuality.limitations.join(" "))}` : ""}</p>

  <div class="footer">
    <span>Rapor No: ${reportNo}</span>
    <span>Oluşturma: ${formatDate(new Date().toISOString())}</span>
    <span>PestShield AI Command Center — İç kullanım içindir</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
