// "Alacak / Vade Raporu" — borçlu müşterilerin bakiye ve vade durumunu
// (gecikmiş/gecikmemiş, gecikme gün sayısı) tek tabloda özetleyen yaşlandırma raporu.

import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";

export interface AlacakReportRow {
  customerName: string;
  accountCode: string;
  balance: number;
  isOverdue: boolean;
  overdueDays: number;
  lastInvoiceDate: string | null;
}

export async function printAlacakRaporu(rows: AlacakReportRow[]) {
  const reportNo = `ALC-${Date.now().toString().slice(-8)}`;
  const totalBalance = rows.reduce((sum, r) => sum + r.balance, 0);
  const overdueRows = rows.filter((r) => r.isOverdue);
  const totalOverdue = overdueRows.reduce((sum, r) => sum + r.balance, 0);

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Alacak / Vade Raporu</title>
<style>
  ${LETTERHEAD_STYLES}
  .gradient-banner {
    margin-top: 22px;
    border-radius: 14px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #b45309, #dc2626);
    color: #fff;
  }
  .gradient-banner .g-title { font-size: 16px; font-weight: 800; }
  .gradient-banner .g-sub { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px; }
  .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .kpi-box { flex: 1; min-width: 130px; border-radius: 10px; padding: 11px 13px; background: #fff7ed; border: 1px solid #fed7aa; }
  .kpi-label { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #9a3412; margin: 0 0 3px; }
  .kpi-value { font-size: 13px; font-weight: 800; color: #7c2d12; margin: 0; }
  .overdue-tag { color: #dc2626; font-weight: 700; }
  @media print { .gradient-banner, .kpi-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Alacak / Vade Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="gradient-banner">
    <div class="g-title">Alacak Durumu Özeti</div>
    <div class="g-sub">${rows.length} borçlu müşteri incelendi</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Toplam Alacak</p><p class="kpi-value">${formatCurrency(totalBalance)}</p></div>
    <div class="kpi-box"><p class="kpi-label">Vadesi Geçen Tutar</p><p class="kpi-value">${formatCurrency(totalOverdue)}</p></div>
    <div class="kpi-box"><p class="kpi-label">Vadesi Geçen Müşteri</p><p class="kpi-value">${overdueRows.length}</p></div>
    <div class="kpi-box"><p class="kpi-label">Borçlu Müşteri Sayısı</p><p class="kpi-value">${rows.length}</p></div>
  </div>

  <div class="section-block" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Müşteri</th>
          <th>Cari Kod</th>
          <th>Son Fatura Tarihi</th>
          <th>Vade Durumu</th>
          <th class="num">Bakiye</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length > 0
            ? rows
                .map(
                  (r) => `<tr>
          <td>${escapeHtml(r.customerName)}</td>
          <td>${escapeHtml(r.accountCode)}</td>
          <td>${r.lastInvoiceDate ? formatDate(r.lastInvoiceDate) : "—"}</td>
          <td>${r.isOverdue ? `<span class="overdue-tag">${r.overdueDays} gün gecikti</span>` : "Vadesinde"}</td>
          <td class="num">${formatCurrency(r.balance)}</td>
        </tr>`,
                )
                .join("")
            : `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Borçlu müşteri bulunmuyor.</td></tr>`
        }
      </tbody>
      <tfoot>
        <tr><td colspan="4">Genel Toplam</td><td class="num">${formatCurrency(totalBalance)}</td></tr>
      </tfoot>
    </table>
  </div>

  <div class="footer">
    <span>PestShield AI — Alacak / Vade Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
