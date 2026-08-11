// "Risk Durum Raporu" — risk kayıtlarının skoru, kategorisi ve önlem
// durumunu özetleyen denetim raporu.

import { formatDate } from "@/components/crm/crm-format";
import { LETTERHEAD_STYLES, escapeHtml, footerBrandLabel, openPrintWindow, renderLetterhead } from "@/lib/pdf/shared";
import { riskLevel, type RiskLevel } from "@/lib/mock/audit";
import type { RiskRow } from "@/lib/audit-report-data";

const CATEGORY_LABELS: Record<RiskRow["category"], string> = {
  biological: "Biyolojik",
  chemical: "Kimyasal",
  physical: "Fiziksel",
  operational: "Operasyonel",
  regulatory: "Regülasyon",
};

const STATUS_LABELS: Record<RiskRow["status"], string> = {
  open: "Açık",
  mitigating: "Önlem Alınıyor",
  closed: "Kapandı",
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export async function printRiskRaporu(rows: RiskRow[]) {
  const reportNo = `RISK-${Date.now().toString().slice(-8)}`;
  const activeCount = rows.filter((r) => r.status !== "closed").length;
  const criticalCount = rows.filter((r) => r.status !== "closed" && riskLevel(r.score) === "critical").length;
  const highCount = rows.filter((r) => r.status !== "closed" && r.score >= 9).length;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Risk Durum Raporu</title>
<style>
  ${LETTERHEAD_STYLES}
  .gradient-banner { margin-top: 22px; border-radius: 14px; padding: 16px 20px; background: linear-gradient(135deg, #7c2d12, #b91c1c); color: #fff; }
  .gradient-banner .g-title { font-size: 16px; font-weight: 800; }
  .gradient-banner .g-sub { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px; }
  .kpi-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
  .kpi-box { flex: 1; min-width: 130px; border-radius: 10px; padding: 11px 13px; background: #fef2f2; border: 1px solid #fecaca; }
  .kpi-label { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #991b1b; margin: 0 0 3px; }
  .kpi-value { font-size: 13px; font-weight: 800; color: #7f1d1d; margin: 0; }
  .risk-detail-row td { background: #f8fafc; padding: 4px 10px 12px; border-bottom: 2px solid #eef1f5; }
  .risk-detail-grid { display: flex; gap: 18px; font-size: 10.5px; }
  .risk-detail-grid > div { flex: 1; }
  .risk-detail-label { font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #64748b; font-size: 9px; margin: 0 0 2px; }
  .risk-detail-value { color: #334155; margin: 0; }
  @media print {
    .gradient-banner, .kpi-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .risk-detail-row td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  ${renderLetterhead({ docTitle: "Risk Durum Raporu", docNo: reportNo, docDate: new Date().toISOString() })}

  <div class="gradient-banner">
    <div class="g-title">Risk Değerlendirme Özeti</div>
    <div class="g-sub">${rows.length} risk kaydı incelendi</div>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box"><p class="kpi-label">Aktif Risk</p><p class="kpi-value">${activeCount}</p></div>
    <div class="kpi-box"><p class="kpi-label">Yüksek / Kritik</p><p class="kpi-value">${highCount}</p></div>
    <div class="kpi-box"><p class="kpi-label">Kritik Seviye</p><p class="kpi-value">${criticalCount}</p></div>
    <div class="kpi-box"><p class="kpi-label">Toplam Risk</p><p class="kpi-value">${rows.length}</p></div>
  </div>

  <div class="section-block" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Başlık</th>
          <th>Müşteri</th>
          <th>Kategori</th>
          <th>Skor</th>
          <th>Sorumlu</th>
          <th>Gözden Geçirme</th>
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
          <td>${escapeHtml(CATEGORY_LABELS[r.category])}</td>
          <td>${LEVEL_LABELS[riskLevel(r.score)]} · ${r.score}</td>
          <td>${escapeHtml(r.owner)}</td>
          <td>${formatDate(r.reviewDate)}</td>
          <td>${escapeHtml(STATUS_LABELS[r.status])}</td>
        </tr>
        <tr class="risk-detail-row">
          <td colspan="7">
            <div class="risk-detail-grid">
              <div>
                <p class="risk-detail-label">Açıklama</p>
                <p class="risk-detail-value">${escapeHtml(r.description) || "—"}</p>
              </div>
              <div>
                <p class="risk-detail-label">Önlem</p>
                <p class="risk-detail-value">${escapeHtml(r.mitigation) || "—"}</p>
              </div>
            </div>
          </td>
        </tr>`,
                )
                .join("")
            : `<tr><td colspan="7" style="text-align:center; color:#94a3b8;">Kayıt bulunamadı.</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>${footerBrandLabel()} — Risk Durum Raporu</span>
    <span>Oluşturma Tarihi: ${formatDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
