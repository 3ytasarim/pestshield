// Kullanıcının kendi yüklediği .docx şablonundaki {yer_tutucu} etiketlerini
// gerçek verilerle doldurup, kullanıcının KENDİ fontları/tabloları/logosuyla
// birebir aynı yeni bir .docx üretir. Sunucuda LibreOffice olmadığından
// (bkz. next.config.ts) bu işlem — tıpkı template-rasterize.ts ve
// excel-export.ts'deki dosya üretimleri gibi — tamamen tarayıcıda yapılır.

interface DocxTemplateError {
  properties?: { explanation?: string };
  message?: string;
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Verilen .docx şablonunu (data URL) `data` ile doldurup indirilebilir bir Blob döner.
 * Tekli alanlar düz `{alan}`, tekrarlanan tablo satırları `{#dizi}...{/dizi}` yer
 * tutucularıyla eşleşir (docxtemplater'ın standart sözdizimi). */
export async function mergeDocxTemplate(templateDataUrl: string, data: Record<string, unknown>): Promise<Blob> {
  const { default: PizZip } = await import("pizzip");
  const { default: Docxtemplater } = await import("docxtemplater");

  const buffer = dataUrlToArrayBuffer(templateDataUrl);
  const zip = new PizZip(buffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  try {
    doc.render(data);
  } catch (error) {
    const errors = (error as { properties?: { errors?: DocxTemplateError[] } })?.properties?.errors;
    const first = errors?.[0];
    const explanation = first?.properties?.explanation ?? first?.message;
    throw new Error(explanation ? `Şablon hatası: ${explanation}` : "Şablon doldurulamadı — yer tutucuları kontrol edin");
  }

  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }) as Blob;
}
