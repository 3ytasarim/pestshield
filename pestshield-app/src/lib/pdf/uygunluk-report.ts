// "Uygunluk Durum Raporu" — seçilen standart(lar)a göre checklist
// maddelerinin uygunluk durumunu özetleyen denetim raporu.

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import { STANDARD_LABELS } from "@/lib/audit-report-data";
import type { ChecklistItem } from "@/lib/mock/audit";

const STATUS_LABELS: Record<ChecklistItem["status"], string> = {
  compliant: "Uygun",
  non_compliant: "Uygunsuz",
  pending: "İnceleniyor",
  not_applicable: "Uygulanamaz",
};

export async function printUygunlukRaporu(rows: ChecklistItem[], standardLabel: string, complianceRatio: number) {
  const reportNo = `UYG-${Date.now().toString().slice(-8)}`;
  const nonCompliant = rows.filter((r) => r.status === "non_compliant").length;
  const pending = rows.filter((r) => r.status === "pending").length;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Uygunluk Durum Raporu</title>
<style>
  ${LETTERHEAD_STYLES}
  .gradient-banner { margin-top: 22px; border-radius: 14px; padding: 16px 20px; background: linear-gradient(135deg, #0f2942, #1e3a5f); color: #fff; }
  .gradient-banner .g-title { font-size: 16px; font-weight: 800; }
  .gradient-banner .g-sub { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px; }
  .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .kpi-box { flex: 1; min-width: 130px; border-radius: 10px; padding: 11px 13px; background: #f8fafc; border: 1px solid #e2e8f0; }
  .kpi-label { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #64748b; margin: 0 0 3px; }
  .kpi-value { font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; }
  @media print { .gradient-banner, .kpi-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Uygunluk Durum Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="gradient-banner">
    <div class="g-title">${escapeHtml(standardLabel)}</div>
    <div class="g-sub">${rows.length} madde incelendi — uygunluk oranı %${complianceRatio}</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Uygunluk Oranı</p><p class="kpi-value">%${complianceRatio}</p></div>
    <div class="kpi-box"><p class="kpi-label">Uygunsuz Madde</p><p class="kpi-value">${nonCompliant}</p></div>
    <div class="kpi-box"><p class="kpi-label">İnceleniyor</p><p class="kpi-value">${pending}</p></div>
    <div class="kpi-box"><p class="kpi-label">Toplam Madde</p><p class="kpi-value">${rows.length}</p></div>
  </div>

  <div class="section-block" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Standart</th>
          <th>Bölüm</th>
          <th>Madde</th>
          <th>Durum</th>
          <th>Değerlendiren</th>
          <th>Tarih</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length > 0
            ? rows
                .map(
                  (r) => `<tr>
          <td>${escapeHtml(STANDARD_LABELS[r.standard])}</td>
          <td>${escapeHtml(r.sectionCode)} — ${escapeHtml(r.sectionTitle)}</td>
          <td>${escapeHtml(r.itemCode)} ${escapeHtml(r.title)}</td>
          <td>${escapeHtml(STATUS_LABELS[r.status])}</td>
          <td>${escapeHtml(r.reviewedBy)}</td>
          <td>${formatDate(r.reviewDate)}</td>
        </tr>`,
                )
                .join("")
            : `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>PestShield AI — Uygunluk Durum Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
