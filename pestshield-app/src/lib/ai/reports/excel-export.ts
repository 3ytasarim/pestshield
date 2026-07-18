"use client";

// PestShield AI Command Center — Faz 2 Excel export.
//
// exceljs (tarayıcıda çalışır) kullanılır — uygulamada başka bir Excel
// kütüphanesi yoktu, bu yüzden birden fazla çakışan kütüphane eklenmedi.
// Gizli/hassas alanlar (ör. iç risk skor formülü ayrıntıları dışındaki
// dahili alanlar) dışa aktarılmaz — sadece kullanıcıya panelde zaten
// gösterilen aynı özet veriler.

import ExcelJS from "exceljs";
import type { AiOperationalReportPdfData as AiOperationalReportData } from "@/lib/pdf/ai-operational-report";

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F2942" } };
  });
}

export async function exportAiOperationalReportExcel(data: AiOperationalReportData, title: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PestShield AI Command Center";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Özet");
  summarySheet.columns = [
    { header: "Gösterge", key: "label", width: 32 },
    { header: "Değer", key: "value", width: 20 },
  ];
  styleHeaderRow(summarySheet.getRow(1));
  for (const kpi of data.kpis) summarySheet.addRow({ label: kpi.label, value: kpi.value });
  summarySheet.addRow({});
  summarySheet.addRow({ label: "Dönem Başlangıcı", value: data.period.from });
  summarySheet.addRow({ label: "Dönem Bitişi", value: data.period.to });
  summarySheet.addRow({ label: "Kaynak Kayıt Sayısı", value: data.sourceRecordCount });
  summarySheet.views = [{ state: "frozen", ySplit: 1 }];

  const trendSheet = workbook.addWorksheet("Aylık Trend");
  trendSheet.columns = [
    { header: "Ay", key: "label", width: 18 },
    { header: "Servis Sayısı", key: "value", width: 16 },
  ];
  styleHeaderRow(trendSheet.getRow(1));
  for (const p of data.serviceTrendChart.series[0]?.points ?? []) trendSheet.addRow({ label: p.label, value: p.value });
  trendSheet.views = [{ state: "frozen", ySplit: 1 }];

  if (data.riskDistribution.length > 0) {
    const riskSheet = workbook.addWorksheet("Riskler");
    riskSheet.columns = [
      { header: "Kategori", key: "category", width: 24 },
      { header: "Açık Kayıt Sayısı", key: "count", width: 20 },
    ];
    styleHeaderRow(riskSheet.getRow(1));
    for (const r of data.riskDistribution) riskSheet.addRow({ category: r.category, count: r.count });
    riskSheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  const sourceSheet = workbook.addWorksheet("Veri Kaynağı");
  sourceSheet.columns = [
    { header: "Alan", key: "field", width: 24 },
    { header: "Değer", key: "value", width: 40 },
  ];
  styleHeaderRow(sourceSheet.getRow(1));
  sourceSheet.addRow({ field: "Kapsam", value: data.scope === "customer" ? (data.entityName ?? "—") : "Şirket Geneli" });
  sourceSheet.addRow({ field: "Veri Kalitesi", value: data.dataQuality.status });
  sourceSheet.addRow({ field: "Sınırlamalar", value: data.dataQuality.limitations.join("; ") || "—" });
  sourceSheet.addRow({ field: "Oluşturma Zamanı", value: new Date().toISOString() });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^\p{L}\p{N}]+/gu, "-")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
