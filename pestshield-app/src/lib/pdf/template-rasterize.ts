// Sözleşme/Teklif/Tahsilat Raporu için yüklenen PDF/DOCX şablonunu tarayıcıda
// (sunucuda LibreOffice olmadığından) tam sayfa bir PNG görüntüsüne çevirir.
// Bu PNG, mevcut "background" antetli kağıt mekanizmasıyla (bkz. pdf/shared.ts
// renderLetterhead) belge çıktısının tam sayfa arkaplanı olarak kullanılır.

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

let workerConfigured = false;
function ensurePdfWorker() {
  if (workerConfigured) return;
  GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  workerConfigured = true;
}

async function rasterizePdf(file: File): Promise<string> {
  ensurePdfWorker();
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas oluşturulamadı");
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
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
    const canvas = await html2canvas(firstPage, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    return canvas.toDataURL("image/png");
  } finally {
    document.body.removeChild(container);
  }
}

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Yüklenen PDF/DOCX dosyasının ilk sayfasını tam sayfa bir PNG data URL'e çevirir. */
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
