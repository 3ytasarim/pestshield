import { formatDate } from "@/components/crm/crm-format";
import { escapeHtml, LETTERHEAD_STYLES, openPrintWindow, renderLetterhead, renderSignatures } from "@/lib/pdf/shared";
import type { Customer, WorkOrder, WorkOrderStatus } from "@/lib/mock/crm";

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  planned: "Planlandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  delayed: "Gecikti",
  cancelled: "İptal",
};

/** İş emrini kurumsal bir servis raporu olarak biçimlendirip yeni sekmede yazdırma diyaloğunu açar (Farklı Kaydet → PDF). */
export function printWorkOrder(customer: Customer, order: WorkOrder) {
  const productsList = order.productsUsed.length
    ? `<ul style="margin:4px 0 0;padding-left:18px;">${order.productsUsed.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
    : "<p style=\"margin:4px 0 0;color:#94a3b8;\">Kayıtlı ürün yok</p>";

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>İş Emri Raporu — ${escapeHtml(customer.companyName)}</title>
<style>${LETTERHEAD_STYLES}</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "İş Emri Raporu", docNo: order.orderNo, docDate: order.completedDate ?? order.plannedDate })}

  <div class="party-grid">
    <div class="party-card">
      <p class="party-label">Müşteri</p>
      <p class="party-name">${escapeHtml(customer.companyName)}</p>
      <p class="party-line">${escapeHtml(customer.contactName)}${customer.contactTitle ? " · " + escapeHtml(customer.contactTitle) : ""}</p>
      <p class="party-line">${escapeHtml(customer.addressLine)}, ${escapeHtml(customer.district)}/${escapeHtml(customer.city)}</p>
    </div>
    <div class="party-card">
      <p class="party-label">Servis Bilgisi</p>
      <p class="party-name">${escapeHtml(order.serviceType)}</p>
      <p class="party-line">Durum: ${STATUS_LABELS[order.status]}</p>
      <p class="party-line">Teknisyen: ${escapeHtml(order.technician)}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <p class="info-label">Planlanan Tarih</p>
      <p class="info-value">${formatDate(order.plannedDate)}</p>
    </div>
    <div class="info-box">
      <p class="info-label">Tamamlanma Tarihi</p>
      <p class="info-value">${order.completedDate ? formatDate(order.completedDate) : "—"}</p>
    </div>
    <div class="info-box">
      <p class="info-label">Kontrol Edilen İstasyon</p>
      <p class="info-value">${order.stationsChecked}</p>
    </div>
  </div>

  <p class="section-label">Kullanılan Ürünler</p>
  ${productsList}

  ${
    order.riskFinding
      ? `<p class="section-label">Risk Bulgusu</p><div class="note-block">${escapeHtml(order.riskFinding)}</div>`
      : ""
  }

  ${
    order.technicianNote
      ? `<p class="section-label">Teknisyen Notu</p><div class="note-block">${escapeHtml(order.technicianNote)}</div>`
      : ""
  }

  ${renderSignatures(customer.companyName)}

  <div class="footer">
    <span>Bu rapor PestShield tarafından otomatik olarak oluşturulmuştur.</span>
    <span>${order.orderNo} · ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
