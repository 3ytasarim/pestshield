import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { getCompanySettings } from "@/lib/company-settings";
import { escapeHtml, footerBrandLabel, LETTERHEAD_STYLES, openPrintWindow, renderLetterhead, renderSignatures } from "@/lib/pdf/shared";
import { mergeDocxTemplate } from "@/lib/pdf/docx-merge";
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
  ${renderLetterhead({ docTitle: "Teklif", docNo: offer.offerNo, docDate: offer.createdAt, templateImage: getCompanySettings().offerLetterheadImage })}

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
    <span>Bu teklif ${footerBrandLabel()} tarafından otomatik olarak oluşturulmuştur.</span>
    <span>${offer.offerNo} · ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

/** Şirket Ayarları'nda yüklenen Teklif .docx şablonundaki {yer_tutucu} etiketlerini
 * bu teklifin gerçek verileriyle doldurup indirir — kullanıcının kendi Word
 * belgesiyle birebir aynı formatta bir çıktı üretir (bkz. docx-merge.ts). */
export async function downloadOfferDocx(customer: Customer, offer: Offer) {
  const res = await fetch("/api/account/company-settings/offer-template-docx");
  const data = res.ok ? ((await res.json()) as { dataUrl: string | null }) : { dataUrl: null };
  if (!data.dataUrl) {
    throw new Error("Önce Şirket Ayarları'ndan Teklif için bir Word (.docx) şablonu yükleyin");
  }

  const company = getCompanySettings();
  const genelToplam = formatCurrency(offer.amount, offer.currency);

  const blob = await mergeDocxTemplate(data.dataUrl, {
    teklif_no: offer.offerNo,
    teklif_baslik: offer.title,
    teklif_tarihi: formatDate(offer.createdAt),
    gecerlilik_tarihi: formatDate(offer.validUntil),
    genel_toplam: genelToplam,
    para_birimi: offer.currency,
    bugun: formatDate(new Date().toISOString()),

    musteri_adi: customer.companyName,
    musteri_yetkili: customer.contactName,
    musteri_unvan: customer.contactTitle,
    musteri_adres: [customer.addressLine, customer.district, customer.city].filter(Boolean).join(", "),
    musteri_vergi_no: customer.taxNumber,
    musteri_vergi_dairesi: customer.taxOffice,

    firma_adi: company.companyName,
    firma_yetkili: company.authorizedName,
    firma_adres: [company.address, company.district, company.city].filter(Boolean).join(", "),
    firma_vergi_no: company.taxNumber,
    firma_vergi_dairesi: company.taxOffice,
    firma_iban: company.iban,
    firma_telefon: company.phone,

    kalemler: offer.items.map((item) => ({
      aciklama: item.description,
      birim_fiyat: formatCurrency(item.unitPrice, offer.currency),
      adet: item.quantity,
      tutar: formatCurrency(item.unitPrice * item.quantity, offer.currency),
    })),
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Teklif-${offer.offerNo}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
