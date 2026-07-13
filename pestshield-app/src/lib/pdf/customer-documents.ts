// Müşteri düzenleme ekranındaki "Uygulama QR Kodu" panelinden indirilebilen
// belgeler — QR Kod Etiketi, Ürün Uygulama Belgesi, Müşteri Hijyen Takip
// Sistemi Afişi. Bu belgelerde "Firma" = giriş yapan haşere yönetim şirketinin
// kendi kimliği (Şirket Ayarları'ndaki logo/ad), "Müşteri" = bu CRM'deki
// müşteri kaydı — tıpkı diğer PDF belgelerinde (cari ekstre, teklif) olduğu
// gibi. QR kod, müşterinin servis geçmişi/raporlarının bulunduğu sekmeye
// (Servisler) yönlendirir.

import QRCode from "qrcode";
import { formatDate } from "@/components/crm/crm-format";
import { getCompanySettings } from "@/lib/company-settings";
import { getCertificateTemplate } from "@/lib/certificate-templates";
import { escapeHtml, openPrintWindow } from "@/lib/pdf/shared";
import type { Customer } from "@/lib/mock/crm";

function reportsUrl(customer: Customer): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/dashboard/client/customers/${customer.id}?tab=work-history`;
}

async function qrDataUrl(customer: Customer, size = 240): Promise<string> {
  return QRCode.toDataURL(reportsUrl(customer), { width: size, margin: 1, color: { dark: "#0f2942", light: "#ffffff" } });
}

function companyLogoImg(logo: string | null, className: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const src = logo || `${origin}/logo-icon.png`;
  return `<img src="${src}" alt="Logo" class="${className}" onerror="this.style.display='none'" />`;
}

function docNo(prefix: string, customer: Customer): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${customer.accountCode.replace("CARI-", "")}-${today}`;
}

/** QR Kod Etiketi — hijyen istasyonuna yapıştırılacak kompakt etiket. */
export async function printQrLabel(customer: Customer) {
  const company = getCompanySettings();
  const qr = await qrDataUrl(customer, 220);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>QR Kod Etiketi — ${escapeHtml(customer.companyName)}</title>
<style>
  @page { size: 140mm 100mm; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", -apple-system, Inter, Arial, sans-serif;
    margin: 0;
    padding: 8mm;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
  }
  .label {
    position: relative;
    width: 100%;
    max-width: 460px;
    aspect-ratio: 1.4 / 1;
    background: url("${origin}/posters/label-bg.png") center / 100% 100% no-repeat;
  }
  .label-header {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 23%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    padding: 0 20px;
    font-size: 16px;
    font-weight: 800;
  }
  .label-body {
    position: absolute;
    top: 23%;
    bottom: 16.2%;
    left: 0; right: 0;
    padding: 10px 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 22px;
  }
  .logo-box {
    width: 40%;
    aspect-ratio: 1 / 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-box img { max-width: 84%; max-height: 78%; object-fit: contain; }
  .qr-block { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .qr-block img { width: 130px; height: 130px; border-radius: 8px; }
  .qr-caption { font-size: 11px; color: #2563eb; text-align: center; line-height: 1.4; max-width: 150px; font-weight: 600; }
  .label-footer {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 16.2%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-align: center;
    padding: 0 18px;
    font-size: 14px;
    font-weight: 800;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .label { max-width: none; width: 100%; height: 100%; aspect-ratio: auto; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="label">
    <div class="label-header">Hijyen Takip Etiketi</div>
    <div class="label-body">
      <div class="logo-box">${companyLogoImg(company.logo, "")}</div>
      <div class="qr-block">
        <img src="${qr}" alt="QR" />
        <p class="qr-caption">QR kodu okutarak raporları görüntüleyebilirsiniz.</p>
      </div>
    </div>
    <div class="label-footer">${escapeHtml(company.companyName || "PestShield")}</div>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

/** Ürün Uygulama Belgesi — A4 dikey, Şirket Ayarları'nda seçilen şablona göre resmi sertifika görünümü. */
export async function printApplicationCertificate(customer: Customer) {
  const company = getCompanySettings();
  const template = getCertificateTemplate();
  const qr = await qrDataUrl(customer, 220);
  const companyName = escapeHtml(company.companyName || "PestShield Haşere Yönetim Hizmetleri");
  const authorizedLine = company.authorizedName.trim() ? `Yetkili: ${escapeHtml(company.authorizedName.trim())}` : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const sealHtml = template.sealImage
    ? `<img src="${template.sealImage}" alt="" class="seal-img" />`
    : `<div class="seal-placeholder"></div>`;

  const bodyHtml = `
        ${companyLogoImg(company.logo, "cert-logo")}
        <div class="cert-workplace">${escapeHtml(customer.companyName)}</div>
        <div class="cert-title">Ürün Uygulama Belgesi</div>
      </div>

      <div class="cert-body-block">
        <p class="cert-body-tr">
          Bu işyerine, <b>"${companyName} — Dezenfeksiyon ve Haşere Kontrol Sistemleri"</b> tarafından periyodik
          olarak Sağlık Bakanlığı tarafından ruhsatlandırılmış ürünlerle uygulama hizmeti verilmektedir.
        </p>
        <p class="cert-body-en">
          "In this workplace, disinfection and/or pest control service is provided by "${companyName}" with the
          products that are approved by The Ministry of Health."
        </p>
      </div>

      <div class="cert-spacer"></div>

      <div class="cert-bottom-row">
        <div class="digital-badge">
          <div class="digital-badge-medal">
            <div class="digital-badge-medal-inner">
              <strong>%100</strong>
              <span>Dijital Hizmet</span>
            </div>
          </div>
          <div class="digital-badge-ribbon"><i></i><i></i></div>
        </div>

        <div class="seal-badge">
          ${sealHtml}
          <p class="seal-label">Ruhsatlı ve Onaylıdır</p>
        </div>

        <div class="cert-qr">
          <img src="${qr}" alt="QR" />
          <p class="cert-qr-caption">Hizmet raporları için taratın</p>
        </div>
      </div>

      <div class="cert-footnote">
        Uygulamalarda kullandığımız tüm haşere kontrol kimyasalları ve uygulama metotlarımız Dünya Sağlık Örgütü
        (WHO) onaylı ve sağlık bakanlığı ruhsatlı ve izinli ürünler ve uygulamalardır.
        <div class="cert-meta">
          <span>Belge No: ${docNo("UYG", customer)}</span>
          <span>Düzenleme Tarihi: ${formatDate(new Date().toISOString())}</span>
          ${authorizedLine ? `<span>${authorizedLine}</span>` : ""}
        </div>
      </div>`;

  const sharedStyles = `
  .cert-header { text-align: center; }
  .cert-logo { width: 108px; height: 108px; object-fit: contain; margin: 0 auto 22px; display: block; }
  .cert-workplace { font-size: 26px; font-weight: 800; letter-spacing: 0.03em; color: #0f2942; text-transform: uppercase; }
  .cert-title { font-size: 15px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 8px; }
  .cert-body-block { margin-top: 60px; text-align: center; max-width: 560px; margin-left: auto; margin-right: auto; }
  .cert-body-tr { font-size: 13.5px; line-height: 1.75; color: #1e293b; }
  .cert-body-en { font-size: 12px; line-height: 1.65; color: #64748b; font-style: italic; margin-top: 18px; }
  .cert-spacer { flex: 1; }
  .cert-bottom-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 40px; }
  .digital-badge { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .digital-badge-medal {
    width: 84px; height: 84px; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fdf0c8, #d9a63d 55%, #a8781f 100%);
    border: 2px solid #8a6118;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  }
  .digital-badge-medal-inner {
    width: 66px; height: 66px; border-radius: 50%; border: 1.5px dashed #8a6118;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #5c3f0e; text-align: center; line-height: 1.15;
  }
  .digital-badge-medal-inner strong { font-size: 15px; font-weight: 800; }
  .digital-badge-medal-inner span { font-size: 7px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  .digital-badge-ribbon { display: flex; gap: 3px; margin-top: -6px; }
  .digital-badge-ribbon i { width: 12px; height: 26px; background: #a8781f; clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%); }

  .seal-badge { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .seal-img { width: 92px; height: 92px; object-fit: contain; }
  .seal-placeholder { width: 92px; height: 92px; border-radius: 50%; border: 2px dashed #cbd5e1; }
  .seal-label { font-size: 9.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.03em; text-align: center; max-width: 110px; }

  .cert-qr { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cert-qr img { width: 88px; height: 88px; border-radius: 6px; }
  .cert-qr-caption { font-size: 9.5px; color: #64748b; text-align: center; max-width: 130px; }

  .cert-footnote { margin-top: 30px; padding-top: 16px; text-align: center; font-size: 9px; color: #94a3b8; line-height: 1.5; }
  .cert-meta { margin-top: 10px; display: flex; justify-content: center; gap: 22px; font-size: 9px; color: #94a3b8; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`;

  const html =
    template.style === "green-frame"
      ? `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Ürün Uygulama Belgesi — ${escapeHtml(customer.companyName)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Inter, Arial, sans-serif; margin: 0; color: #1e293b; }
  .cert-page {
    position: relative;
    width: 210mm;
    height: 275mm;
    background: url("${origin}/posters/cert-frame-green.png") center / 100% 100% no-repeat;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .cert-card {
    position: absolute;
    inset: 18mm 17mm 24mm;
    display: flex;
    flex-direction: column;
    padding: 10px 6px;
    overflow: hidden;
  }
  .cert-title { color: #0f5132; }
  ${sharedStyles}
</style>
</head>
<body>
  <div class="cert-page">
    <div class="cert-card">
      <div class="cert-header">${bodyHtml}
    </div>
  </div>
</body>
</html>`
      : `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Ürün Uygulama Belgesi — ${escapeHtml(customer.companyName)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Inter, Arial, sans-serif; margin: 0; color: #1e293b; }
  .cert-page {
    position: relative;
    height: 275mm;
    background: linear-gradient(160deg, #0a1e3d 0%, #123258 45%, #0a1e3d 100%);
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
    padding: 16mm;
  }
  .ribbon {
    position: absolute;
    width: 480px;
    height: 260px;
    background: linear-gradient(135deg, #fdf0c8 0%, #e8bf6a 35%, #c9942f 60%, #f5d98a 100%);
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.25);
  }
  .ribbon-tr { top: -90px; right: -150px; transform: rotate(35deg); }
  .ribbon-bl { bottom: -90px; left: -150px; transform: rotate(35deg); }
  .cert-card {
    position: relative;
    background: #fcfcfa;
    border-radius: 6px;
    border: 1px solid #d9c07f;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
    height: calc(275mm - 32mm - 2px);
    overflow: hidden;
    padding: 48px 56px 40px;
    display: flex;
    flex-direction: column;
  }
  .cert-card::before {
    content: "";
    position: absolute;
    inset: 10px;
    border: 1px solid #e5d19c;
    border-radius: 4px;
    pointer-events: none;
  }
  .cert-title { color: #b8862f; }
  .cert-footnote { border-top: 1px solid #e5d19c; }
  ${sharedStyles}
</style>
</head>
<body>
  <div class="cert-page">
    <div class="ribbon ribbon-tr"></div>
    <div class="ribbon ribbon-bl"></div>
    <div class="cert-card">
      <div class="cert-header">${bodyHtml}
    </div>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

const POSTER_PANELS = [
  { image: "/posters/p1-final.png", title: "Saha Uygulaması", desc: "Uzman ekiplerimiz düzenli periyotlarla sahada." },
  { image: "/posters/p2-final.png", title: "Tam Kapsamlı Koruma", desc: "Haşere ve dezenfeksiyon çözümleri bir arada." },
  { image: "/posters/p3-final.png", title: "Hijyen Onaylı İşletme", desc: "Onaylı hijyen etiketimizle müşterilerinize güven verin." },
  { image: "/posters/p4-final.png", title: "Dijital Kayıt Sistemi", desc: "Tüm uygulamalar QR kod ile anlık kayıt altında." },
];

/** Müşteri Hijyen Takip Sistemi Afişi — A4 dikey, gerçek illüstrasyon panelli profesyonel tanıtım posteri. */
export async function printHygienePoster(customer: Customer) {
  const company = getCompanySettings();
  const qr = await qrDataUrl(customer, 180);
  const companyName = escapeHtml(company.companyName || "PestShield Haşere Yönetim Hizmetleri");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const panelsHtml = POSTER_PANELS.map(
    (p) => `
        <div class="panel">
          <img src="${origin}${p.image}" alt="" class="panel-img" />
          <div class="panel-scrim"></div>
          <div class="panel-text">
            <p class="panel-title">${p.title}</p>
            <p class="panel-desc">${p.desc}</p>
          </div>
        </div>`,
  ).join("");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Hijyen Takip Sistemi Afişi — ${escapeHtml(customer.companyName)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Inter, Arial, sans-serif; margin: 0; color: #0f172a; }
  .poster { min-height: 297mm; display: flex; flex-direction: column; background: #fff; }

  .poster-intro { text-align: center; padding: 34px 40px 26px; }
  .poster-logo { width: 96px; height: 96px; object-fit: contain; margin: 0 auto 24px; display: block; }
  .poster-quote { font-size: 14px; font-weight: 700; color: #0f2942; font-style: italic; }
  .poster-lead { font-size: 11.5px; color: #475569; margin-top: 6px; max-width: 480px; margin-left: auto; margin-right: auto; }
  .poster-question { font-size: 23px; font-weight: 800; color: #0f2942; margin-top: 18px; letter-spacing: -0.01em; }
  .poster-explain { font-size: 11.5px; color: #64748b; margin-top: 10px; max-width: 460px; margin-left: auto; margin-right: auto; line-height: 1.6; }
  .poster-thanks { font-size: 12px; font-weight: 700; color: #0f2942; margin-top: 12px; }

  .panel-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
  .panel { position: relative; overflow: hidden; min-height: 150px; }
  .panel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
  .panel-scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.15) 55%, rgba(15, 23, 42, 0) 75%); }
  .panel-text { position: absolute; left: 0; right: 0; bottom: 0; padding: 20px 22px; color: #fff; }
  .panel-title { font-size: 14px; font-weight: 800; margin: 0 0 4px; }
  .panel-desc { font-size: 10.5px; opacity: 0.9; line-height: 1.45; margin: 0; max-width: 220px; }

  .poster-customer-strip { text-align: center; padding: 16px 24px; background: #f0fdf4; border-top: 1px solid #bbf7d0; border-bottom: 1px solid #bbf7d0; }
  .poster-customer-strip b { color: #14532d; }

  .poster-footer { background: #0f172a; color: #fff; padding: 22px 40px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .poster-qr { display: flex; align-items: center; gap: 14px; }
  .poster-qr img { width: 64px; height: 64px; border-radius: 6px; }
  .poster-qr-text { font-size: 10px; line-height: 1.5; max-width: 230px; opacity: 0.8; margin: 0; }
  .poster-footer-name { font-size: 12.5px; font-weight: 700; }
  .poster-hashtag { font-size: 12px; font-weight: 700; color: #5eead4; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="poster">
    <div class="poster-intro">
      ${companyLogoImg(company.logo, "poster-logo")}
      <p class="poster-quote">'Müşteri Hijyen Takip Sistemini Sizlere Tanıtalım'</p>
      <p class="poster-lead">Bu işletmede sizlerin sağlığını korumak için aldığımız hizmetleri dijital olarak takip edebilirsiniz.</p>
      <p class="poster-question">Sağlığınızı Korumak İçin Neler Yapıyoruz?</p>
      <p class="poster-explain">İşletmemizde aldığımız tüm haşere kontrol ve dezenfeksiyon uygulamalarının tarihlerine QR kodu okutarak erişebilirsiniz.</p>
      <p class="poster-thanks">Bizim için önemlisiniz.</p>
    </div>

    <div class="poster-customer-strip">Bu işletme: <b>${escapeHtml(customer.companyName)}</b></div>

    <div class="panel-grid">${panelsHtml}</div>

    <div class="poster-footer">
      <div class="poster-qr">
        <img src="${qr}" alt="QR" />
        <p class="poster-qr-text">QR kodu okutarak bu işletmeye ait güncel hijyen ve servis raporlarına ulaşabilirsiniz.</p>
      </div>
      <div style="text-align:right;">
        <p class="poster-footer-name">${companyName}</p>
        <p class="poster-hashtag">#hijyenheryerde</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
