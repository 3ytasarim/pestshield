import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { escapeHtml, LETTERHEAD_STYLES, openPrintWindow, renderLetterhead, renderSignatures } from "@/lib/pdf/shared";
import type { Customer, Offer } from "@/lib/mock/crm";

const STATUS_LABELS: Record<Offer["status"], string> = {
  draft: "Taslak",
  sent: "Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

/** Teklifi kurumsal bir belge olarak biçimlendirip yeni sekmede yazdırma diyaloğunu açar (Farklı Kaydet → PDF). */
export function printOffer(customer: Customer, offer: Offer) {
  const rows = offer.items
    .map(
      (item, i) => `
      <tr class="${i % 2 === 1 ? "alt" : ""}">
        <td>${escapeHtml(item.description)}</td>
        <td class="num">${formatCurrency(item.unitPrice)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatCurrency(item.unitPrice * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Teklif — ${escapeHtml(customer.companyName)}</title>
<style>${LETTERHEAD_STYLES}</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Teklif", docNo: offer.offerNo, docDate: offer.createdAt })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customer.companyName)}</p>
      <p class="party-line">${escapeHtml(customer.contactName)}${customer.contactTitle ? " · " + escapeHtml(customer.contactTitle) : ""}</p>
      <p class="party-line">${escapeHtml(customer.addressLine)}, ${escapeHtml(customer.district)}/${escapeHtml(customer.city)}</p>
      <p class="party-line">Vergi No: ${escapeHtml(customer.taxNumber)}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Teklif Bilgisi</p>
      <p class="party-name">${escapeHtml(offer.title)}</p>
      <p class="party-line">Durum: ${STATUS_LABELS[offer.status]}</p>
      <p class="party-line">Geçerlilik Tarihi: ${formatDate(offer.validUntil)}</p>
    </div>
  </div>

  <p class="section-label">Kalemler</p>
  <table>
    <thead>
      <tr>
        <th>Açıklama</th>
        <th class="num">Birim Fiyat</th>
        <th class="num">Adet</th>
        <th class="num">Tutar</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">Genel Toplam</td>
        <td class="num">${formatCurrency(offer.amount, offer.currency)}</td>
      </tr>
    </tfoot>
  </table>

  ${renderSignatures(customer.companyName)}

  <div class="footer">
    <span>Bu teklif PestShield tarafından otomatik olarak oluşturulmuştur.</span>
    <span>${offer.offerNo} · ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
