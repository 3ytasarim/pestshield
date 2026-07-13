// "PDKS Personel Çalışma Saatleri Raporu" — teknisyenlerin günlük mesai
// başlangıç/bitiş saatleri, çalışma süresi ve saha rotası özetini içeren rapor.

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import type { Technician } from "@/lib/mock/operations";
import type { PdksRow } from "@/lib/pdks-report-data";

export async function printPdksReport(rows: PdksRow[], technician: Technician | null, dateRangeLabel: string) {
  const reportNo = `PDKS-${technician?.id.replace("tech-", "") ?? "TUM"}-${Date.now().toString().slice(-8)}`;

  const totalMinutes = rows.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
  const totalDistance = rows.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalStops = rows.reduce((sum, r) => sum + r.stopCount, 0);

  function fmtDuration(min: number | null): string {
    if (min === null) return "Devam ediyor";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}s ${m}dk`;
  }

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>PDKS Raporu — ${escapeHtml(technician?.name ?? "Tüm Personel")}</title>
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
  @media print {
    .gradient-banner, .kpi-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "PDKS Personel Çalışma Saatleri", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Personel</p>
      <p class="party-name">${escapeHtml(technician?.name ?? "Tüm Personel")}</p>
      <p class="party-line">${escapeHtml(technician?.email ?? "")}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Rapor Aralığı</p>
      <p class="party-name">${escapeHtml(dateRangeLabel)}</p>
      <p class="party-line">${rows.length} kayıt</p>
    </div>
  </div>

  <div class="gradient-banner">
    <div class="g-title">Mesai Özeti</div>
    <div class="g-sub">${rows.length} günlük kayıt incelendi</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Toplam Gün</p><p class="kpi-value">${rows.length}</p></div>
    <div class="kpi-box"><p class="kpi-label">Toplam Çalışma Süresi</p><p class="kpi-value">${fmtDuration(totalMinutes)}</p></div>
    <div class="kpi-box"><p class="kpi-label">Toplam Mesafe</p><p class="kpi-value">${totalDistance.toFixed(1)} km</p></div>
    <div class="kpi-box"><p class="kpi-label">Toplam Ziyaret</p><p class="kpi-value">${totalStops}</p></div>
  </div>

  <div class="section-block" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Personel</th>
          <th>Giriş Saati</th>
          <th>Çıkış Saati</th>
          <th>Çalışma Süresi</th>
          <th>Ziyaret</th>
          <th class="num">Mesafe (km)</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length > 0
            ? rows
                .map(
                  (r) => `<tr>
          <td>${formatDate(r.date)}</td>
          <td>${escapeHtml(r.technicianName)}</td>
          <td>${r.startTime ?? "—"}</td>
          <td>${r.endTime ?? "—"}</td>
          <td>${fmtDuration(r.durationMinutes)}</td>
          <td>${r.stopCount}</td>
          <td class="num">${r.distanceKm.toFixed(1)}</td>
          <td>${escapeHtml(r.statusLabel)}</td>
        </tr>`,
                )
                .join("")
            : `<tr><td colspan="8" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>PestShield AI — PDKS Personel Çalışma Saatleri Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
