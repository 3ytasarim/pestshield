// "Tahsilat Raporu" — seçilen tarih aralığında (ve isteğe bağlı müşteride)
// gerçekleşen tüm tahsilatların (nakit/kart/havale) dökümü.

import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import { PAYMENT_METHOD_LABELS } from "@/components/finance/finance-labels";
import type { LedgerEntry } from "@/lib/mock/finance";

export interface TahsilatReportRow extends LedgerEntry {
  customerName: string;
}

export async function printTahsilatRaporu(rows: TahsilatReportRow[], dateRangeLabel: string, customerLabel: string) {
  const reportNo = `TAH-${Date.now().toString().slice(-8)}`;
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Tahsilat Raporu</title>
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
  @media print { .gradient-banner, .kpi-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Tahsilat Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customerLabel)}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Rapor Aralığı</p>
      <p class="party-name">${escapeHtml(dateRangeLabel)}</p>
      <p class="party-line">${rows.length} kayıt</p>
    </div>
  </div>

  <div class="gradient-banner">
    <div class="g-title">Tahsilat Özeti</div>
    <div class="g-sub">${rows.length} tahsilat kaydı incelendi</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Toplam Tahsilat</p><p class="kpi-value">${formatCurrency(total)}</p></div>
    <div class="kpi-box"><p class="kpi-label">Tahsilat Sayısı</p><p class="kpi-value">${rows.length}</p></div>
    <div class="kpi-box"><p class="kpi-label">Ortalama Tahsilat</p><p class="kpi-value">${formatCurrency(rows.length ? total / rows.length : 0)}</p></div>
  </div>

  <div class="section-block" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Müşteri</th>
          <th>Açıklama</th>
          <th>Yöntem</th>
          <th>Yetkili</th>
          <th class="num">Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length > 0
            ? rows
                .map(
                  (r) => `<tr>
          <td>${formatDate(r.date)}</td>
          <td>${escapeHtml(r.customerName)}</td>
          <td>${escapeHtml(r.description)}</td>
          <td>${r.method ? escapeHtml(PAYMENT_METHOD_LABELS[r.method]) : "—"}</td>
          <td>${escapeHtml(r.performedBy)}</td>
          <td class="num">${formatCurrency(r.amount)}</td>
        </tr>`,
                )
                .join("")
            : `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
      <tfoot>
        <tr><td colspan="5">Genel Toplam</td><td class="num">${formatCurrency(total)}</td></tr>
      </tfoot>
    </table>
  </div>

  <div class="footer">
    <span>PestShield AI — Tahsilat Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
