// "Biyosidal Ürün Kullanım Raporu" — BRC/HACCP pestisit uygulama günlüğü PDF çıktısı.

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import type { ChemicalUsageRow } from "@/lib/chemical-usage-report-data";
import type { Customer } from "@/lib/mock/crm";

export async function printChemicalUsageReport(rows: ChemicalUsageRow[], customer: Customer, dateRangeLabel: string) {
  const reportNo = `BIYO-${customer.accountCode.replace("CARI-", "")}-${Date.now().toString().slice(-8)}`;
  const serviceCount = new Set(rows.map((r) => r.serviceOrderId)).size;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Biyosidal Ürün Kullanım Raporu — ${escapeHtml(customer.companyName)}</title>
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
  ${renderLetterhead({ docTitle: "Biyosidal Ürün Kullanım Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customer.companyName)}</p>
      <p class="party-line">${escapeHtml(customer.addressLine)}${customer.district ? `, ${escapeHtml(customer.district)}` : ""}${customer.city ? ` / ${escapeHtml(customer.city)}` : ""}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Rapor Aralığı</p>
      <p class="party-name">${escapeHtml(dateRangeLabel)}</p>
      <p class="party-line">${rows.length} uygulama kaydı · ${serviceCount} hizmet</p>
    </div>
  </div>

  <div class="gradient-banner">
    <div class="g-title">Biyosidal Ürün Uygulama Günlüğü</div>
    <div class="g-sub">BRC/HACCP denetimi için pestisit uygulama kaydı</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Toplam Uygulama</p><p class="kpi-value">${rows.length}</p></div>
    <div class="kpi-box"><p class="kpi-label">Hizmet Sayısı</p><p class="kpi-value">${serviceCount}</p></div>
    <div class="kpi-box"><p class="kpi-label">Son Uygulama</p><p class="kpi-value">${rows[0] ? formatDate(rows[0].date) : "—"}</p></div>
  </div>

  <div class="section-block" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Hizmet</th>
          <th>Personel</th>
          <th>Kullanılan Biyosidal Ürünler</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length > 0
            ? rows
                .map(
                  (r) => `<tr>
          <td>${formatDate(r.date)}</td>
          <td>${escapeHtml(r.serviceName)}</td>
          <td>${escapeHtml(r.personnelName)}</td>
          <td>${escapeHtml(r.products)}</td>
        </tr>`,
                )
                .join("")
            : `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>PestShield AI — Biyosidal Ürün Kullanım Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
