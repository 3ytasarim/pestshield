// "Kat Planı İstasyon Raporu" — bir tek krokinin kat planı görseli (numaralı
// istasyon işaretleriyle) ve istasyonların en güncel denetim durumunu içeren PDF.

import { formatDate } from "@/components/crm/crm-format";
import { KROKI_STATION_TYPES, stationLabel } from "@/components/crm/kroki-constants";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import { statusSummary, type StationReportRow } from "@/lib/kat-plani-report-data";
import type { Customer, KrokiSketch } from "@/lib/mock/crm";

function docNo(customer: Customer): string {
  const stamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  return `KAT-${customer.accountCode.replace("CARI-", "")}-${stamp}`;
}

export async function printKatPlaniIstasyonRaporu(
  sketch: KrokiSketch,
  rows: StationReportRow[],
  compositeImageDataUrl: string,
  customer: Customer,
  serviceName: string,
) {
  const reportNo = docNo(customer);

  function rowsHtml(): string {
    return KROKI_STATION_TYPES.map((t) => {
      const typeRows = rows.filter((r) => r.station.type === t.value);
      if (typeRows.length === 0) return "";
      return `
      <div class="section-block">
        <p class="block-title"><span class="dot" style="background:${t.color};"></span>${escapeHtml(t.label)} (${typeRows.length} adet)</p>
        <table>
          <thead><tr><th>İstasyon No</th><th>İstasyon ID</th><th>Son Durum</th><th>Son Denetim Tarihi</th></tr></thead>
          <tbody>
            ${typeRows
              .map(
                (r) => `<tr>
              <td><b>#${r.istasyonNo}</b></td>
              <td>${escapeHtml(r.station.stationId || "—")}</td>
              <td>${escapeHtml(statusSummary(r))}</td>
              <td>${r.lastInspectionDate ? formatDate(r.lastInspectionDate) : "—"}</td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
    }).join("");
  }

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Kat Planı İstasyon Raporu — ${escapeHtml(sketch.name)}</title>
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
  .kroki-image-wrap { margin-top: 18px; text-align: center; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #f8fafc; }
  .kroki-image-wrap img { max-width: 100%; max-height: 420px; border-radius: 8px; }
  .section-block { margin-top: 20px; page-break-inside: avoid; }
  .block-title { font-size: 12.5px; font-weight: 700; color: #0f172a; margin: 0 0 8px; display: flex; align-items: center; gap: 6px; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 999px; }
  @media print {
    .gradient-banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-block { break-inside: avoid; }
  }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Kat Planı İstasyon Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customer.companyName)}</p>
      <p class="party-line">${escapeHtml(customer.addressLine)}${customer.district ? `, ${escapeHtml(customer.district)}` : ""}${customer.city ? ` / ${escapeHtml(customer.city)}` : ""}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Hizmet / Kroki</p>
      <p class="party-name">${escapeHtml(serviceName)}</p>
      <p class="party-line">Kroki: ${escapeHtml(sketch.name)}</p>
      <p class="party-line">Toplam İstasyon: ${rows.length}</p>
    </div>
  </div>

  <div class="gradient-banner">
    <div class="g-title">Kat Planı İstasyon Raporu</div>
    <div class="g-sub">${escapeHtml(sketch.name)} — istasyonların yerleşim planı ve en güncel denetim durumu</div>
  </div>

  <div class="kroki-image-wrap">
    <img src="${compositeImageDataUrl}" alt="Kat Planı" />
  </div>

  ${rowsHtml()}

  <div class="footer">
    <span>PestShield AI — Kat Planı İstasyon Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
