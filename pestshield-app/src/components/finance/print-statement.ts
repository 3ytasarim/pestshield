import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { getCompanySettings } from "@/lib/company-settings";
import { openPrintWindow } from "@/lib/pdf/shared";
import type { Customer } from "@/lib/mock/crm";
import type { LedgerEntry } from "@/lib/mock/finance";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

/** Müşteri kartına eklenecek logo &lt;img&gt; bloğu; şirket ayarlarında logo yoksa boş string döner. */
function customerLogoBlock(logoSrc: string | null): string {
  if (!logoSrc) return "";
  return `<img src="${logoSrc}" alt="Logo" class="party-logo" />`;
}

/** "Düzenleyen" imza kutusu metni: firma adı + (girilmişse) Yetkili Adı Soyadı ikinci satırda. */
function signatureLabel(authorizedName: string, companyName: string): string {
  const authorizedLine = authorizedName.trim() ? `<br />Yetkili: <b>${escapeHtml(authorizedName.trim())}</b>` : "";
  return `Düzenleyen — ${escapeHtml(companyName)}${authorizedLine}`;
}

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

  const logoUrl = `${window.location.origin}/logo-icon.png`;
  const company = getCompanySettings();

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Cari Hesap Ekstresi — ${escapeHtml(customer.companyName)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", -apple-system, Inter, Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 28px 34px 36px;
    font-size: 13px;
    line-height: 1.45;
  }

  /* ---------- Başlık / Letterhead ---------- */
  .letterhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 3px solid #0f2942;
  }
  .brand-block { display: flex; align-items: center; gap: 12px; }
  .brand-block img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; }
  .brand-name { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; color: #0f2942; }
  .brand-tagline { font-size: 10.5px; color: #64748b; margin-top: 1px; }
  .doc-meta { text-align: right; }
  .doc-title { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: #0f2942; text-transform: uppercase; }
  .doc-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
  .doc-sub b { color: #334155; font-weight: 600; }

  /* ---------- Firma / Müşteri bilgi kutuları ---------- */
  .party-grid { display: flex; gap: 14px; margin-top: 20px; }
  .party-card {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 13px 15px;
    background: #f8fafc;
  }
  .party-label {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
    margin: 0 0 6px;
  }
  .party-name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .party-line { font-size: 11px; color: #475569; margin: 1px 0; }
  .party-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .party-logo { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; background: #fff; border: 1px solid #e2e8f0; padding: 2px; }

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
  .stat.balance { border-left-color: ${balance > 0 ? "#b91c1c" : "#059669"}; background: ${balance > 0 ? "#fef2f2" : "#ecfdf5"}; }
  .stat-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; margin: 0 0 4px; }
  .stat-value { font-size: 16.5px; font-weight: 800; margin: 0; color: #0f172a; }
  .stat-note { font-size: 9.5px; color: #94a3b8; margin-top: 2px; }

  /* ---------- Hareket tablosu ---------- */
  .section-label {
    margin: 24px 0 8px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
  }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  thead th {
    background: #0f2942;
    color: #fff;
    text-align: left;
    padding: 9px 10px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  thead th.num, td.num { text-align: right; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #eef1f5; vertical-align: top; }
  tbody tr.alt { background: #f8fafc; }
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

  tfoot td {
    padding: 10px;
    border-top: 2px solid #0f2942;
    font-weight: 800;
    font-size: 12.5px;
    color: #0f172a;
  }
  tfoot td.num.debt { color: #b91c1c; }
  tfoot td.num.collection { color: #059669; }

  /* ---------- İmza alanı ---------- */
  .signatures { display: flex; gap: 40px; margin-top: 46px; }
  .signature-box { flex: 1; text-align: center; }
  .signature-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10.5px; color: #64748b; }

  /* ---------- Footer ---------- */
  .footer {
    margin-top: 34px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    font-size: 9.5px;
    color: #94a3b8;
  }

  @media print {
    body { padding: 0; }
    .stat, .party-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="brand-block">
      <img src="${logoUrl}" alt="PestShield" onerror="this.style.display='none'" />
      <div>
        <div class="brand-name">PestShield</div>
        <div class="brand-tagline">Haşere Yönetim &amp; Denetim Platformu</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">Cari Hesap Ekstresi</div>
      <div class="doc-sub">Ekstre No: <b>${statementNo}</b></div>
      <div class="doc-sub">Düzenleme Tarihi: <b>${formatDate(today)}</b></div>
    </div>
  </div>

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Firma</p>
      <div class="party-heading">
        ${customerLogoBlock(company.logo)}
        <p class="party-name" style="margin:0;">${escapeHtml(company.companyName || "PestShield Haşere Yönetim Hizmetleri")}</p>
      </div>
      <p class="party-line">Tuzla OSB, İstanbul, Türkiye</p>
      <p class="party-line">Tel: 0212 000 00 00 &nbsp;·&nbsp; E-posta: muhasebe@pestshield.app</p>
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
    <div class="stat balance">
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

  <div class="signatures">
    <div class="signature-box"><div class="signature-line">${signatureLabel(company.authorizedName, company.companyName || "PestShield")}</div></div>
    <div class="signature-box"><div class="signature-line">Yetkili İmza / Kaşe — ${escapeHtml(customer.companyName)}</div></div>
  </div>

  <div class="footer">
    <span>Bu ekstre PestShield tarafından otomatik olarak oluşturulmuştur.</span>
    <span>${statementNo} · ${formatDate(today)}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
