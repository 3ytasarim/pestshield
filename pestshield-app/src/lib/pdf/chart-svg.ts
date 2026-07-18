// PestShield — Trend Analiz Raporu için bağımlılıksız (kütüphanesiz) SVG grafik üreticileri.
//
// Yazdırma penceresi düz bir HTML dizesidir (bkz. src/lib/pdf/shared.ts
// openPrintWindow) — harici bir grafik kütüphanesi (Chart.js vb.) CDN'den
// yüklemek yerine, eksen/gridline/etiket/lejantlı SVG'yi doğrudan string
// olarak üretiyoruz. Böylece rapor internet bağlantısı olmadan da güvenilir
// şekilde yazdırılabilir/PDF'e dönüşür.

import { escapeHtml } from "@/lib/pdf/shared";

const CHART_WIDTH = 680;
const CHART_HEIGHT = 220;
const PAD_LEFT = 34;
const PAD_RIGHT = 12;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
}

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 4 ? 4 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function renderLegend(series: { name: string; color: string }[]): string {
  return `
  <div class="chart-legend">
    ${series.map((s) => `<span class="chart-legend-item"><span class="chart-legend-swatch" style="background:${s.color};"></span>${escapeHtml(s.name)}</span>`).join("")}
  </div>`;
}

function axisAndGridSvg(maxValue: number, tickCount: number, plotW: number, plotH: number): { ticks: number[]; svg: string } {
  const ticks: number[] = [];
  for (let i = 0; i <= tickCount; i++) ticks.push(Math.round((maxValue / tickCount) * i));
  const lines = ticks
    .map((t) => {
      const y = PAD_TOP + plotH - (t / maxValue) * plotH;
      return `<line x1="${PAD_LEFT}" y1="${y}" x2="${PAD_LEFT + plotW}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />
      <text x="${PAD_LEFT - 6}" y="${y + 3}" font-size="9" fill="#64748b" text-anchor="end">${t}</text>`;
    })
    .join("");
  return { ticks, svg: lines };
}

/** Yığılmış (stacked) çubuk grafik — ör. Yem Tüketimi Var/Yok/Kırık aylık dağılımı. */
export function renderStackedBarChartSvg(categories: string[], series: ChartSeries[]): string {
  const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const totals = categories.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const maxValue = niceMax(Math.max(1, ...totals));
  const { svg: gridSvg } = axisAndGridSvg(maxValue, 4, plotW, plotH);

  const groupW = plotW / categories.length;
  const barW = Math.min(46, groupW * 0.5);

  const bars = categories
    .map((cat, i) => {
      const cx = PAD_LEFT + groupW * i + groupW / 2;
      let yCursor = PAD_TOP + plotH;
      const segs = series
        .map((s) => {
          const v = s.values[i] ?? 0;
          const segH = (v / maxValue) * plotH;
          const y = yCursor - segH;
          yCursor -= segH;
          if (v <= 0) return "";
          return `<rect x="${cx - barW / 2}" y="${y}" width="${barW}" height="${segH}" fill="${s.color}"><title>${escapeHtml(s.name)}: ${v}</title></rect>`;
        })
        .join("");
      return `${segs}<text x="${cx}" y="${PAD_TOP + plotH + 16}" font-size="9" fill="#64748b" text-anchor="middle">${escapeHtml(cat)}</text>`;
    })
    .join("");

  return `
  <svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" width="100%" style="max-width:${CHART_WIDTH}px;">
    ${gridSvg}
    <line x1="${PAD_LEFT}" y1="${PAD_TOP + plotH}" x2="${PAD_LEFT + plotW}" y2="${PAD_TOP + plotH}" stroke="#cbd5e1" stroke-width="1" />
    ${bars}
  </svg>
  ${renderLegend(series)}`;
}

/** Çizgi grafik — ör. iç/dış alan uçkun sayım trendi. */
export function renderLineChartSvg(categories: string[], series: ChartSeries[]): string {
  const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const allValues = series.flatMap((s) => s.values);
  const maxValue = niceMax(Math.max(1, ...allValues));
  const { svg: gridSvg } = axisAndGridSvg(maxValue, 4, plotW, plotH);

  const stepX = categories.length > 1 ? plotW / (categories.length - 1) : 0;
  const xFor = (i: number) => PAD_LEFT + (categories.length > 1 ? stepX * i : plotW / 2);
  const yFor = (v: number) => PAD_TOP + plotH - (v / maxValue) * plotH;

  const lines = series
    .map((s) => {
      const points = s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
      const dots = s.values.map((v, i) => `<circle cx="${xFor(i)}" cy="${yFor(v)}" r="2.6" fill="${s.color}" />`).join("");
      return `<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2" />${dots}`;
    })
    .join("");

  const xLabels = categories.map((c, i) => `<text x="${xFor(i)}" y="${PAD_TOP + plotH + 16}" font-size="9" fill="#64748b" text-anchor="middle">${escapeHtml(c)}</text>`).join("");

  return `
  <svg viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" width="100%" style="max-width:${CHART_WIDTH}px;">
    ${gridSvg}
    <line x1="${PAD_LEFT}" y1="${PAD_TOP + plotH}" x2="${PAD_LEFT + plotW}" y2="${PAD_TOP + plotH}" stroke="#cbd5e1" stroke-width="1" />
    ${lines}
    ${xLabels}
  </svg>
  ${renderLegend(series)}`;
}

export const CHART_STYLES = `
  .chart-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; justify-content: center; }
  .chart-legend-item { display: flex; align-items: center; gap: 5px; font-size: 9.5px; color: #475569; }
  .chart-legend-swatch { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
`;
