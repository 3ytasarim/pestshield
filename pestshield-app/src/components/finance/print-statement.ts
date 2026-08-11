import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { getCompanySettings } from "@/lib/company-settings";
import { escapeHtml, footerBrandLabel, LETTERHEAD_STYLES, openPrintWindow, renderLetterhead, renderSignatures } from "@/lib/pdf/shared";
import type { Customer } from "@/lib/mock/crm";
import type { LedgerEntry } from "@/lib/mock/finance";

/** Firma kartına eklenecek logo &lt;img&gt; bloğu; şirket ayarlarında logo yoksa boş string döner. */
function companyLogoBlock(logoSrc: string | null): string {
  if (!logoSrc) return "";
  return `<img src="${logoSrc}" alt="Logo" class="party-logo" />`;
}

const STATEMENT_STYLES = `
  /* ---------- Özet şerit ---------- */
  .summary-strip { display: flex; gap: 12px; margin-top: 18px; }
  .stat {
    flex: 1;
    border-radius: 10px;
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #cbd5e1;
  }
  .stat.debt { border-left-color: #b91c1c; background: #fef2f2; }
  .stat.collection { border-left-color: #059669; background: #ecfdf5; }
  .stat-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; margin: 0 0 4px; }
  .stat-value { font-size: 16.5px; font-weight: 800; margin: 0; color: #0f172a; }
  .stat-note { font-size: 9.5px; color: #94a3b8; margin-top: 2px; }

  .party-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .party-logo { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; background: #fff; border: 1px solid #e2e8f0; padding: 2px; }

  .c-date { white-space: nowrap; color: #64748b; }
  .desc { color: #334155; }
  .tag {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.02em;
    padding: 1px 6px;
    border-radius: 999px;
    margin-right: 6px;
    text-transform: uppercase;
    vertical-align: middle;
  }
  .tag-debt { background: #fee2e2; color: #b91c1c; }
  .tag-collection { background: #d1fae5; color: #047857; }
  td.debt { color: #b91c1c; font-weight: 600; }
  td.collection { color: #059669; font-weight: 600; }
  td.balance-cell { font-weight: 700; color: #0f172a; }
  tfoot td.num.debt { color: #b91c1c; }
  tfoot td.num.collection { color: #059669; }

  @media print {
    .stat { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

/** Cari hesap ekstresini yeni bir sekmede kurumsal bir belge olarak biçimlendirip tarayıcının yazdırma diyaloğunu açar (Farklı Kaydet → PDF). */
export function printCurrentAccountStatement(customer: Customer, entries: LedgerEntry[], balance: number) {
  const totalDebt = entries.filter((e) => e.type === "debt").reduce((sum, e) => sum + e.amount, 0);
  const totalCollection = entries.filter((e) => e.type === "collection").reduce((sum, e) => sum + e.amount, 0);

  const periodStart = entries[0]?.date;
  const periodEnd = entries[entries.length - 1]?.date;
  const today = new Date().toISOString();
  const statementNo = `CH-${customer.accountCode.replace("CARI-", "")}-${today.slice(0, 10).replace(/-/g, "")}`;

  const rows = entries
    .map(
      (e, i) => `
      <tr class="${i % 2 === 1 ? "alt" : ""}">
        <td class="c-date">${formatDate(e.date)}</td>
        <td>
          <span class="tag ${e.type === "debt" ? "tag-debt" : "tag-collection"}">${e.type === "debt" ? "Borç" : "Tahsilat"}</span>
          <span class="desc">${escapeHtml(e.description)}</span>
        </td>
        <td class="num debt">${e.type === "debt" ? formatCurrency(e.amount) : "—"}</td>
        <td class="num collection">${e.type === "collection" ? formatCurrency(e.amount) : "—"}</td>
        <td class="num balance-cell">${formatCurrency(e.balanceAfter)}</td>
      </tr>`,
    )
    .join("");

  const company = getCompanySettings();
  const companyContactLines = [company.address ? `${company.address}${company.district ? `, ${company.district}` : ""}${company.city ? `/${company.city}` : ""}` : "", company.phone ? `Tel: ${company.phone}` : ""]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Cari Hesap Ekstresi — ${escapeHtml(customer.companyName)}</title>
<style>
  ${LETTERHEAD_STYLES}
  ${STATEMENT_STYLES}
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Cari Hesap Ekstresi", docNo: statementNo, docDate: today })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Firma</p>
      <div class="party-heading">
        ${companyLogoBlock(company.logo)}
        <p class="party-name" style="margin:0;">${escapeHtml(company.companyName)}</p>
      </div>
      ${companyContactLines ? `<p class="party-line">${companyContactLines}</p>` : ""}
    </div>
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customer.companyName)}</p>
      <p class="party-line">${escapeHtml(customer.contactName)}${customer.contactTitle ? " · " + escapeHtml(customer.contactTitle) : ""}</p>
      <p class="party-line">${escapeHtml(customer.addressLine)}, ${escapeHtml(customer.district)}/${escapeHtml(customer.city)}</p>
      <p class="party-line">Cari Kodu: ${escapeHtml(customer.accountCode)} &nbsp;·&nbsp; Vergi No: ${escapeHtml(customer.taxNumber)}</p>
    </div>
  </div>

  <div class="summary-strip">
    <div class="stat debt">
      <p class="stat-label">Toplam Borç</p>
      <p class="stat-value">${formatCurrency(totalDebt)}</p>
    </div>
    <div class="stat collection">
      <p class="stat-label">Toplam Tahsilat</p>
      <p class="stat-value">${formatCurrency(totalCollection)}</p>
    </div>
    <div class="stat" style="border-left-color: ${balance > 0 ? "#b91c1c" : "#059669"}; background: ${balance > 0 ? "#fef2f2" : "#ecfdf5"};">
      <p class="stat-label">Net Bakiye</p>
      <p class="stat-value">${formatCurrency(balance)}</p>
      <p class="stat-note">${balance > 0 ? "Müşteri Borçlu" : "Bakiye Kapandı"}</p>
    </div>
  </div>

  <p class="section-label">Hesap Hareketleri ${periodStart && periodEnd ? `· ${formatDate(periodStart)} — ${formatDate(periodEnd)}` : ""}</p>
  <table>
    <thead>
      <tr>
        <th>Tarih</th>
        <th>Açıklama</th>
        <th class="num">Borç</th>
        <th class="num">Alacak</th>
        <th class="num">Bakiye</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2">Toplam</td>
        <td class="num debt">${formatCurrency(totalDebt)}</td>
        <td class="num collection">${formatCurrency(totalCollection)}</td>
        <td class="num">${formatCurrency(balance)}</td>
      </tr>
    </tfoot>
  </table>

  ${renderSignatures(customer.companyName)}

  <div class="footer">
    <span>Bu ekstre ${footerBrandLabel()} tarafından otomatik olarak oluşturulmuştur.</span>
    <span>${statementNo} · ${formatDate(today)}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
