// PestShield AI Command Center — Faz 2 denetim hazırlık skoru.
//
// Bu, resmi bir sertifikasyon sonucu DEĞİLDİR — sadece checklist
// maddelerinin durumlarından hesaplanan, iç kullanım için deterministik
// bir operasyonel göstergedir. Formül açıkça belgelenir ve versiyonlanır
// (bkz. Faz 2 spesifikasyonu bölüm 8): "not_applicable" maddeler hesaba
// katılmaz; skor = uygun / (uygun + uygun_değil + beklemede) * 100.

import type { AiChecklistRecord } from "@/lib/ai/providers/data-provider";
import type { AiAuditFactorDetail, AiAuditIntelligenceData, AiDataQuality } from "@/lib/ai/types";
import { safeRatio } from "@/lib/ai/analysis/period-comparison";

export const AUDIT_SCORE_FORMULA_VERSION = "audit-readiness-v1";

const STANDARD_LABELS: Record<string, string> = {
  haccp: "HACCP",
  brcgs: "BRCGS Gıda Güvenliği",
  iso22000: "ISO 22000",
  fssc: "FSSC 22000",
};

export function computeAuditReadiness(items: AiChecklistRecord[]): AiAuditIntelligenceData {
  if (items.length === 0) {
    const dataQuality: AiDataQuality = { status: "unavailable", missingFields: ["checklist"], limitations: ["Checklist verisi bulunamadı."] };
    return {
      scoreFormulaVersion: AUDIT_SCORE_FORMULA_VERSION,
      overallScorePercent: null,
      factors: [],
      missingDocuments: [],
      disclaimer: "Bu, iç operasyonel bir göstergedir; resmi bir sertifikasyon sonucu değildir.",
      dataQuality,
    };
  }

  const byStandard = new Map<string, AiChecklistRecord[]>();
  for (const item of items) {
    if (!byStandard.has(item.standard)) byStandard.set(item.standard, []);
    byStandard.get(item.standard)!.push(item);
  }

  const factors: AiAuditFactorDetail[] = [];
  let totalCompliant = 0;
  let totalScorable = 0;
  const missingDocuments: string[] = [];

  for (const [standard, standardItems] of byStandard.entries()) {
    const compliant = standardItems.filter((i) => i.status === "compliant").length;
    const nonCompliant = standardItems.filter((i) => i.status === "non_compliant").length;
    const pending = standardItems.filter((i) => i.status === "pending").length;
    const scorable = compliant + nonCompliant + pending;
    const ratio = safeRatio(compliant, scorable);
    factors.push({ standard: STANDARD_LABELS[standard] ?? standard, compliant, nonCompliant, pending, scorePercent: ratio.ratioPercent });
    totalCompliant += compliant;
    totalScorable += scorable;
    if (nonCompliant > 0) missingDocuments.push(`${STANDARD_LABELS[standard] ?? standard}: ${nonCompliant} uygunsuz madde`);
    if (pending > 0) missingDocuments.push(`${STANDARD_LABELS[standard] ?? standard}: ${pending} beklemede madde`);
  }

  const overall = safeRatio(totalCompliant, totalScorable);
  const dataQuality: AiDataQuality =
    totalScorable === 0
      ? { status: "insufficient", missingFields: [], limitations: ["Değerlendirilebilir checklist maddesi bulunamadı."] }
      : { status: "complete", missingFields: [], limitations: [] };

  return {
    scoreFormulaVersion: AUDIT_SCORE_FORMULA_VERSION,
    overallScorePercent: overall.ratioPercent,
    factors: factors.sort((a, b) => (a.scorePercent ?? 0) - (b.scorePercent ?? 0)),
    missingDocuments,
    disclaimer: "Bu, iç operasyonel bir göstergedir; resmi bir sertifikasyon sonucu değildir.",
    dataQuality,
  };
}
