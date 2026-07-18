// PestShield AI Command Center — Faz 4 günlük operasyon brifingi.
//
// Deterministik: get_dashboard_summary (Faz 1) ile AYNI hesaplamayı, artı
// açık proaktif uyarı sayısını (Faz 4 alert engine) kullanır — ikinci bir
// hesaplama katmanı İCAT EDİLMEZ, mevcut, zaten doğrulanmış mantık yeniden
// kullanılır.

import { executeAiTool } from "@/lib/ai/tools/executor";
import { listAlerts } from "@/lib/ai/alerts/alert-store";
import type { AiDataProvider } from "@/lib/ai/providers/data-provider";
import type { AiKpiItem } from "@/lib/ai/types";

export interface DailyBriefing {
  dateIso: string;
  summaryText: string;
  kpis: AiKpiItem[];
  activeAlertCount: number;
  criticalAlertCount: number;
}

export async function buildDailyBriefing(provider: AiDataProvider, todayIso: string): Promise<DailyBriefing> {
  const dashboard = await executeAiTool(provider, "get_dashboard_summary", {}, todayIso);
  const activeAlerts = listAlerts().filter((a) => a.status === "active" || a.status === "acknowledged");
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");

  const parts = [dashboard.message];
  if (criticalAlerts.length > 0) {
    parts.push(`${criticalAlerts.length} kritik uyarı açık durumda.`);
  } else if (activeAlerts.length > 0) {
    parts.push(`${activeAlerts.length} açık proaktif uyarı var.`);
  }

  return {
    dateIso: todayIso,
    summaryText: `Günaydın. ${parts.join(" ")}`,
    kpis: dashboard.kpis ?? [],
    activeAlertCount: activeAlerts.length,
    criticalAlertCount: criticalAlerts.length,
  };
}
