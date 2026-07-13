// Biyosidal Ürün Kullanım Raporu — Raporlar hub'ından doğrudan doldurup
// yazdırılan, resmi EK-1 formuyla aynı alan yapısına sahip ama belirli bir
// periyot ziyaretine bağlı olmayan, imza gerektirmeyen hızlı bir uygulama raporu.

import { formatDate } from "@/components/crm/crm-format";
import { escapeHtml, openPrintWindow } from "@/lib/pdf/shared";

export interface BiyosidalRaporFormValues {
  uygulayanFirmaAdi: string;
  acikAdresi: string;
  mesulMudur: string;
  uygulayicilar: string;
  telefon: string;
  izinTarihSayisi: string;
  ekipSorumlusu: string;
  urunTicariAdi: string;
  urunUygulamaSekli: string;
  urunAktifMaddesi: string;
  urunAntidotu: string;
  urunAmbalajMiktari: string;
  hedefZararliTuru: string;
  uygulamaTarihi: string;
  baslangicSaati: string;
  bitisSaati: string;
  meskenIsyeriVb: string;
  meskenDaireSayisi: string;
  uygulamaAlani: string;
  uygulamaAlaniBirimi: string;
  guvenlikOnlemleri: string;
}

function row(label: string, value: string): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

function sectionHeader(title: string): string {
  return `<tr class="section"><td colspan="2">${escapeHtml(title)}</td></tr>`;
}

export async function printBiyosidalUygulamaRaporu(form: BiyosidalRaporFormValues, uygulamaYeriAdresi: string, customerName: string) {
  const timeRange = [
    form.uygulamaTarihi ? formatDate(form.uygulamaTarihi) : "",
    form.baslangicSaati || form.bitisSaati ? `${form.baslangicSaati} - ${form.bitisSaati}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Biyosidal Ürün Uygulama Raporu — ${escapeHtml(customerName)}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #111; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
  .title { font-size: 13px; font-weight: 800; }
  .subtitle { font-size: 10px; color: #333; margin-top: 2px; }
  .meta { text-align: right; font-size: 10px; color: #333; }
  .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  tr.section td { font-weight: 700; padding: 5px 6px; border: 1px solid #000; background: #fff; font-size: 11px; }
  th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; vertical-align: top; font-size: 10.5px; }
  th { width: 34%; font-weight: 700; background: #f4f4f4; }
  td { width: 66%; }
  .note { margin-top: 14px; font-size: 9.5px; font-weight: 700; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 8.5px; color: #666; }
  @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header-row">
    <div>
      <div class="title">BİYOSİDAL ÜRÜN UYGULAMA RAPORU</div>
      <div class="subtitle">(EK-1 Formu esas alınarak hazırlanmıştır)</div>
    </div>
    <div class="meta">
      <div>${escapeHtml(customerName)}</div>
      <div>${form.uygulamaTarihi ? formatDate(form.uygulamaTarihi) : "—"}</div>
    </div>
  </div>

  <table>
    ${sectionHeader("Uygulamayı Yapana Ait Bilgiler")}
    ${row("Uygulamayı Yapan Firma Adı", form.uygulayanFirmaAdi)}
    ${row("Açık Adresi", form.acikAdresi)}
    ${row("Mesul Müdür", form.mesulMudur)}
    ${row("Uygulayıcı(lar) Adı, Soyadı", form.uygulayicilar)}
    ${row("Telefon", form.telefon)}
    ${row("Müdürlük İzin Tarih ve Sayısı", form.izinTarihSayisi)}
    ${row("Ekip Sorumlusu", form.ekipSorumlusu)}

    ${sectionHeader("Kullanılan Biyosidal Ürüne Ait Bilgiler")}
    ${row("Ürünün Ticari Adı, Ruhsat Tarih ve Sayısı", form.urunTicariAdi)}
    ${row("Ürünün Uygulama Şekli", form.urunUygulamaSekli)}
    ${row("Ürünün Aktif Maddesi", form.urunAktifMaddesi)}
    ${row("Ürünün Antidotu", form.urunAntidotu)}
    ${row("Ürünün Ambalajının Miktarı (kg/litre)", form.urunAmbalajMiktari)}

    ${sectionHeader("Uygulama Yapılan Yer Hakkında Bilgiler")}
    ${row("Uygulama Yapılan Yerin Açık Adresi", uygulamaYeriAdresi)}
    ${row("Uygulama Yapılan Hedef Zararlı Türü/Adı", form.hedefZararliTuru)}
    ${row("Uygulama Tarihi, Başlangıç ve Bitiş Saati", timeRange)}
    ${row("Mesken/İşyeri vb.", form.meskenIsyeriVb)}
    ${row("Mesken İse Daire Sayısı", form.meskenDaireSayisi)}
    ${row("Uygulama Yapılan Yerin Alanı", [form.uygulamaAlani, form.uygulamaAlaniBirimi].filter(Boolean).join(" "))}
    ${row("Alınan Güvenlik Önlemleri, Yapılan Öneri ve Uyarılar", form.guvenlikOnlemleri)}
  </table>

  <div class="note">Not: ZEHİRLENME DURUMLARINDA GEREKTİĞİNDE ULUSAL ZEHİR DANIŞMA MERKEZİNİN (UZEM) 114 VE ACİL SAĞLIK HİZMETLERİNİN 112 NOLU TELEFONUNU ARAYINIZ.</div>

  <div class="footer">
    <span>PestShield AI</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
