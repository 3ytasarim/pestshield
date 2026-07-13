// "CAPA Durum Raporu" — düzeltici/önleyici faaliyetlerin durumu, önceliği
// ve gecikme bilgisini özetleyen denetim raporu.

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import type { CapaRow } from "@/lib/audit-report-data";

const SEVERITY_LABELS: Record<CapaRow["severity"], string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

const STATUS_LABELS: Record<CapaRow["status"], string> = {
  open: "Açık",
  in_progress: "Devam Ediyor",
  resolved: "Çözüldü",
  verified: "Doğrulandı",
};

export async function printCapaRaporu(rows: CapaRow[]) {
  const reportNo = `CAPA-${Date.now().toString().slice(-8)}`;
  const overdueCount = rows.filter((r) => r.overdue).length;
  const criticalCount = rows.filter((r) => r.severity === "critical").length;
  const openCount = rows.filter((r) => r.status === "open" || r.status === "in_progress").length;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>CAPA Durum Raporu</title>
<style>
  ${LETTERHEAD_STYLES}
  .gradient-banner { margin-top: 22px; border-radius: 14px; padding: 16px 20px; background: linear-gradient(135deg, #b45309, #dc2626); color: #fff; }
  .gradient-banner .g-title { font-size: 16px; font-weight: 800; }
  .gradient-banner .g-sub { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px; }
  .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .kpi-box { flex: 1; min-width: 130px; border-radius: 10px; padding: 11px 13px; background: #fff7ed; border: 1px solid #fed7aa; }
  .kpi-label { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #9a3412; margin: 0 0 3px; }
  .kpi-value { font-size: 13px; font-weight: 800; color: #7c2d12; margin: 0; }
  .overdue-tag { color: #dc2626; font-weight: 700; }
  @media print { .gradient-banner, .kpi-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "CAPA Durum Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="gradient-banner">
    <div class="g-title">Düzeltici / Önleyici Faaliyet Özeti</div>
    <div class="g-sub">${rows.length} faaliyet incelendi</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Açık Faaliyet</p><p class="kpi-value">${openCount}</p></div>
    <div class="kpi-box"><p class="kpi-label">Vadesi Geçen</p><p class="kpi-value">${overdueCount}</p></div>
    <div class="kpi-box"><p class="kpi-label">Kritik Önem</p><p class="kpi-value">${criticalCount}</p></div>
    <div class="kpi-box"><p class="kpi-label">Toplam Faaliyet</p><p class="kpi-value">${rows.length}</p></div>
  </div>

  <div class="section-block" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Başlık</th>
          <th>Müşteri</th>
          <th>Önem</th>
          <th>Sorumlu</th>
          <th>Vade Tarihi</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length > 0
            ? rows
                .map(
                  (r) => `<tr>
          <td>${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.customerName)}</td>
          <td>${escapeHtml(SEVERITY_LABELS[r.severity])}</td>
          <td>${escapeHtml(r.responsible)}</td>
          <td>${r.overdue ? `<span class="overdue-tag">${formatDate(r.dueDate)} (gecikti)</span>` : formatDate(r.dueDate)}</td>
          <td>${escapeHtml(STATUS_LABELS[r.status])}</td>
        </tr>`,
                )
                .join("")
            : `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>PestShield AI — CAPA Durum Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
