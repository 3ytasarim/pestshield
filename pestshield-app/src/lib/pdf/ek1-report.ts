// EK-1 Biyosidal Ürün Uygulama İşlem Formu — resmi form (Değişik: RG-19/4/2014-28977)
// yapısına birebir uygun, sade siyah-beyaz tablo görünümlü PDF çıktısı.

import { formatDate, formatDateLong } from "@/components/crm/crm-format";
import { escapeHtml, openPrintWindow } from "@/lib/pdf/shared";
import type { Ek1Form, PeriyotOccurrence } from "@/lib/mock/crm";

type Ek1PrintOccurrence = Pick<PeriyotOccurrence, "periodDate" | "startTime" | "endTime">;

function row(label: string, value: string): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

function sectionHeader(title: string): string {
  return `<tr class="section"><td colspan="2">${escapeHtml(title)}</td></tr>`;
}

export async function printEk1Form(form: Ek1Form, occurrence: Ek1PrintOccurrence, customerName: string, batchName: string) {
  const timeRange = `${formatDateLong(occurrence.periodDate)} ${occurrence.startTime} - ${occurrence.endTime}`;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>EK-1 Formu — ${escapeHtml(customerName)}</title>
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
  .sig-table { margin-top: 16px; }
  .sig-table td { height: 70px; vertical-align: bottom; border: 1px solid #000; width: 50%; padding: 6px 8px; }
  .sig-img { display: block; max-height: 46px; max-width: 90%; object-fit: contain; margin-bottom: 4px; }
  .sig-name { font-weight: 700; }
  .sig-role { font-size: 9.5px; color: #333; }
  .note { margin-top: 14px; font-size: 9.5px; font-weight: 700; }
  .note2 { margin-top: 4px; font-size: 9.5px; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 8.5px; color: #666; }
  @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header-row">
    <div>
      <div class="title">EK-1 BİYOSİDAL ÜRÜN UYGULAMA İŞLEM FORMU</div>
      <div class="subtitle">(Değişik: RG-19/4/2014-28977)</div>
    </div>
    <div class="meta">
      <div>${escapeHtml(customerName)}</div>
      <div>${escapeHtml(batchName)}</div>
      <div>${formatDate(occurrence.periodDate)}</div>
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
    ${row("Uygulama Yapılan Yerin Açık Adresi", form.uygulamaYeriAdresi)}
    ${row("Uygulama Yapılan Hedef Zararlı Türü/Adı", form.hedefZararliTuru)}
    ${row("Uygulama Tarihi, Başlangıç ve Bitiş Saati", timeRange)}
    ${row("Mesken/İşyeri vb.", form.meskenIsyeriVb)}
    ${row("Mesken İse Daire Sayısı", form.meskenDaireSayisi)}
    ${row("Uygulama Yapılan Yerin Alanı", [form.uygulamaAlani, form.uygulamaAlaniBirimi].filter(Boolean).join(" "))}
    ${row("Kullanılan Malzemeler", form.kullanilanMalzemeler)}
    ${row("Alınan Güvenlik Önlemleri, Yapılan Öneri ve Uyarılar", form.guvenlikOnlemleri)}
  </table>

  <table class="sig-table">
    <tr>
      <td>
        ${form.ekipSorumlusuImzaData ? `<img src="${form.ekipSorumlusuImzaData}" class="sig-img" alt="İmza" />` : ""}
        <div class="sig-name">${escapeHtml(form.ekipSorumlusuImza)}</div>
        <div class="sig-role">Ekip Sorumlusu İmza</div>
      </td>
      <td>
        ${form.yeriSorumlusuImzaData ? `<img src="${form.yeriSorumlusuImzaData}" class="sig-img" alt="İmza" />` : ""}
        <div class="sig-name">${escapeHtml(form.yeriSorumlusuImza)}</div>
        <div class="sig-role">Uygulama Yapılan Yerin Sorumlusu/Yetkilisi-İmza</div>
      </td>
    </tr>
  </table>

  <div class="note">Not: ZEHİRLENME DURUMLARINDA GEREKTİĞİNDE ULUSAL ZEHİR DANIŞMA MERKEZİNİN (UZEM) 114 VE ACİL SAĞLIK HİZMETLERİNİN 112 NOLU TELEFONUNU ARAYINIZ.</div>
  <div class="note2">Bu form iki nüsha olarak hazırlanır ve bir nüshası uygulama yapılan yerin yetkililerine/sahibine verilmesi zorunludur.</div>

  <div class="footer">
    <span>PestShield AI</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
