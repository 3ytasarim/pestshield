import { formatDate } from "@/components/crm/crm-format";
import { getCompanySettings } from "@/lib/company-settings";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

export const LETTERHEAD_STYLES = `
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
  .letterhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 3px solid #0f2942;
  }
  .brand-block { display: flex; align-items: center; gap: 12px; }
  .brand-block img { width: 42px; height: 42px; border-radius: 10px; object-fit: contain; background: #fff; }
  .brand-name { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; color: #0f2942; }
  .brand-tagline { font-size: 10.5px; color: #64748b; margin-top: 1px; }
  .doc-meta { text-align: right; }
  .doc-title { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: #0f2942; text-transform: uppercase; }
  .doc-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
  .doc-sub b { color: #334155; font-weight: 600; }

  .party-grid { display: flex; gap: 14px; margin-top: 20px; }
  .party-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 13px 15px; background: #f8fafc; }
  .party-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin: 0 0 6px; }
  .party-name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .party-line { font-size: 11px; color: #475569; margin: 1px 0; }

  .section-label { margin: 24px 0 8px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  thead th { background: #0f2942; color: #fff; text-align: left; padding: 9px 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  thead th.num, td.num { text-align: right; }
  tbody td { padding: 8px 10px; border-bottom: 1px solid #eef1f5; vertical-align: top; }
  tbody tr.alt { background: #f8fafc; }
  tfoot td { padding: 10px; border-top: 2px solid #0f2942; font-weight: 800; font-size: 12.5px; color: #0f172a; }

  .info-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
  .info-box { flex: 1; min-width: 150px; border-radius: 10px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .info-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; margin: 0 0 4px; }
  .info-value { font-size: 13.5px; font-weight: 700; margin: 0; color: #0f172a; }

  .note-block { margin-top: 18px; border-radius: 10px; padding: 13px 15px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; }

  .signatures { display: flex; gap: 40px; margin-top: 46px; }
  .signature-box { flex: 1; text-align: center; }
  .signature-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10.5px; color: #64748b; }

  .footer { margin-top: 34px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9.5px; color: #94a3b8; }

  @media print {
    body { padding: 0; }
    .info-box, .party-card, .note-block { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

interface LetterheadOptions {
  docTitle: string;
  docNo: string;
  docDate?: string;
}

/** Belgenin üst kısmı: soldaki firma logosu/adı (Şirket Ayarları'ndan), sağdaki belge başlığı/no. */
export function renderLetterhead({ docTitle, docNo, docDate }: LetterheadOptions): string {
  const company = getCompanySettings();
  const logo = company.logo
    ? `<img src="${company.logo}" alt="Logo" />`
    : `<img src="${typeof window !== "undefined" ? window.location.origin : ""}/logo-icon.png" alt="PestShield" onerror="this.style.display='none'" />`;
  return `
  <div class="letterhead">
    <div class="brand-block">
      ${logo}
      <div>
        <div class="brand-name">${escapeHtml(company.companyName || "PestShield")}</div>
        <div class="brand-tagline">Haşere Yönetim &amp; Denetim Platformu</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">${escapeHtml(docTitle)}</div>
      <div class="doc-sub">Belge No: <b>${escapeHtml(docNo)}</b></div>
      <div class="doc-sub">Düzenleme Tarihi: <b>${formatDate(docDate ?? new Date().toISOString())}</b></div>
    </div>
  </div>`;
}

/** İmza alanı: soldaki kutu düzenleyen firma + Yetkili Adı Soyadı, sağdaki müşterinin imza/kaşe kutusu. */
export function renderSignatures(customerName: string): string {
  const company = getCompanySettings();
  const authorizedLine = company.authorizedName.trim()
    ? `<br />Yetkili: <b>${escapeHtml(company.authorizedName.trim())}</b>`
    : "";
  return `
  <div class="signatures">
    <div class="signature-box"><div class="signature-line">Düzenleyen — ${escapeHtml(company.companyName || "PestShield")}${authorizedLine}</div></div>
    <div class="signature-box"><div class="signature-line">Yetkili İmza / Kaşe — ${escapeHtml(customerName)}</div></div>
  </div>`;
}

/**
 * Belgeyi yeni sekmede açıp tarayıcının yazdırma diyaloğunu tetikler (Farklı Kaydet → PDF).
 * Yazdırma, pencerenin "load" olayına (görseller/logo dahil tüm kaynaklar yüklendikten sonra)
 * kadar ertelenir — aksi halde base64 logo gibi büyük görseller decode olmadan yazdırma
 * diyaloğu açılır ve belgede logo eksik görünür. "load" bir nedenle tetiklenmezse yine de
 * yazdırmanın gerçekleşmesi için kısa bir emniyet gecikmesi de eklenir.
 */
export function openPrintWindow(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    win.print();
  };
  win.addEventListener("load", triggerPrint);
  setTimeout(triggerPrint, 600);
}
