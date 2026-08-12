import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { getCompanySettings } from "@/lib/company-settings";
import { escapeHtml, footerBrandLabel, LETTERHEAD_STYLES, openPrintWindow, renderLetterhead, renderSignatures } from "@/lib/pdf/shared";
import type { Contract, ContractStatus, Customer } from "@/lib/mock/crm";

const STATUS_LABELS: Record<ContractStatus, string> = {
  active: "Aktif",
  expiring: "Süresi Yaklaşıyor",
  expired: "Süresi Doldu",
  cancelled: "İptal",
};

/** Sözleşmeyi kurumsal bir belge olarak biçimlendirip yeni sekmede yazdırma diyaloğunu açar (Farklı Kaydet → PDF). */
export function printContract(customer: Customer, contract: Contract) {
  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Sözleşme — ${escapeHtml(customer.companyName)}</title>
<style>${LETTERHEAD_STYLES}</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Sözleşme", docNo: contract.contractNo, docDate: contract.startDate, templateImage: getCompanySettings().contractLetterheadImage })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customer.companyName)}</p>
      <p class="party-line">${escapeHtml(customer.contactName)}${customer.contactTitle ? " · " + escapeHtml(customer.contactTitle) : ""}</p>
      <p class="party-line">${escapeHtml(customer.addressLine)}, ${escapeHtml(customer.district)}/${escapeHtml(customer.city)}</p>
      <p class="party-line">Vergi No: ${escapeHtml(customer.taxNumber)}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Sözleşme Bilgisi</p>
      <p class="party-name">${escapeHtml(contract.serviceType)}</p>
      <p class="party-line">Durum: ${STATUS_LABELS[contract.status]}</p>
      <p class="party-line">Başlangıç: ${formatDate(contract.startDate)} — Bitiş: ${formatDate(contract.endDate)}</p>
      ${contract.remainingDays >= 0 ? `<p class="party-line">Kalan Gün: ${contract.remainingDays}</p>` : ""}
    </div>
  </div>

  <p class="section-label">Hizmet ve Ücret</p>
  <table>
    <thead>
      <tr>
        <th>Hizmet Türü</th>
        <th class="num">Aylık Tutar</th>
        <th class="num">Başlangıç</th>
        <th class="num">Bitiş</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(contract.serviceType)}</td>
        <td class="num">${formatCurrency(contract.monthlyAmount, contract.currency)}</td>
        <td class="num">${formatDate(contract.startDate)}</td>
        <td class="num">${formatDate(contract.endDate)}</td>
      </tr>
    </tbody>
  </table>

  ${renderSignatures(customer.companyName)}

  <div class="footer">
    <span>Bu sözleşme ${footerBrandLabel()} tarafından otomatik olarak oluşturulmuştur.</span>
    <span>${contract.contractNo} · ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
