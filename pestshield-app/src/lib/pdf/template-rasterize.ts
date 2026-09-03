// Sözleşme/Teklif/Tahsilat Raporu için yüklenen PDF/DOCX şablonunu tarayıcıda
// (sunucuda LibreOffice olmadığından) tam sayfa bir JPEG görüntüsüne çevirir.
// Bu görüntü, mevcut "background" antetli kağıt mekanizmasıyla (bkz. pdf/shared.ts
// renderLetterhead) belge çıktısının tam sayfa arkaplanı olarak kullanılır.

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

let workerConfigured = false;
function ensurePdfWorker() {
  if (workerConfigured) return;
  GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  workerConfigured = true;
}

// Şablon bir CSS background-image olarak sayfanın tamamını kaplayacak şekilde
// %100 ölçeklenerek kullanılıyor (bkz. pdf/shared.ts renderLetterhead) — bu
// yüzden çok yüksek çözünürlük gerekmiyor. scale 2 yerine 1.4 ve PNG yerine
// sıkıştırılmış JPEG kullanmak, kaydetme sırasında sunucuya/isteğe giden
// base64 boyutunu (özellikle renkli/logolu şablonlarda) kat kat küçültüyor —
// aksi halde paylaşımlı hosting (LiteSpeed/CloudLinux) veya proxy'nin istek
// gövdesi sınırına takılıp "Kaydedilemedi" hatası veriyordu.
const RASTER_SCALE = 1.4;
const JPEG_QUALITY = 0.85;
const MAX_OUTPUT_BYTES = 3 * 1024 * 1024; // base64 dahil ~3MB üstü isteği reddet

function toJpegDataUrl(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  // base64 gövdesi yaklaşık boyut*0.75 bayt; burada tam tersini kabaca kontrol ediyoruz.
  const approxBytes = (dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75;
  if (approxBytes > MAX_OUTPUT_BYTES) {
    throw new Error("Şablon görüntüsü çok büyük çıktı — lütfen daha sade/düşük çözünürlüklü bir dosya deneyin");
  }
  return dataUrl;
}

async function rasterizePdf(file: File): Promise<string> {
  ensurePdfWorker();
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: RASTER_SCALE });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas oluşturulamadı");
  // JPEG şeffaflığı desteklemiyor — beyaz zemin basılmazsa boş alanlar siyah çıkar.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return toJpegDataUrl(canvas);
}

async function rasterizeDocx(file: File): Promise<string> {
  const { renderAsync } = await import("docx-preview");
  const { default: html2canvas } = await import("html2canvas");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  document.body.appendChild(container);

  try {
    const buffer = await file.arrayBuffer();
    await renderAsync(buffer, container, undefined, {
      inWrapper: false,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
    });

    const firstPage = container.querySelector<HTMLElement>("section.docx") ?? container;
    const canvas = await html2canvas(firstPage, { scale: RASTER_SCALE, useCORS: true, backgroundColor: "#ffffff" });
    return toJpegDataUrl(canvas);
  } finally {
    document.body.removeChild(container);
  }
}

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Yüklenen PDF/DOCX dosyasının ilk sayfasını tam sayfa bir JPEG data URL'e çevirir. */
export async function rasterizeTemplateFile(file: File): Promise<string> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Dosya 10MB'dan küçük olmalı");
  }
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx");

  if (isPdf) return rasterizePdf(file);
  if (isDocx) return rasterizeDocx(file);
  throw new Error("Lütfen PDF veya DOCX dosyası seçin");
}
