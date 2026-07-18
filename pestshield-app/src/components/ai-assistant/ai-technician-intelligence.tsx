"use client";

import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { AiDataQualityBadge } from "@/components/ai-assistant/ai-data-quality-badge";
import { cn } from "@/lib/utils";
import type { AiTechnicianIntelligenceData } from "@/lib/ai/types";

export function AiTechnicianIntelligence({ data }: { data: AiTechnicianIntelligenceData }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">Teknisyen Performansı</p>
        <AiDataQualityBadge dataQuality={data.dataQuality} />
      </div>
      <ul className="flex flex-col gap-1.5" role="list">
        {data.rows.map((row) => (
          <li key={row.technicianName} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{row.technicianName}</span>
              <span className={cn("font-semibold", row.overdueCount > 0 ? "text-destructive" : "text-success")}>
                {row.completionRatePercent !== null ? `%${row.completionRatePercent} tamamlanma` : "Tamamlanma oranı yok"}
              </span>
            </div>
            <p className="mt-0.5 text-muted-foreground">
              {row.assignedCount} atanan · {row.completedCount} tamamlanan · {row.overdueCount} gecikmiş
            </p>
          </li>
        ))}
      </ul>
      {data.observations.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {data.observations.map((o, i) => (
            <p key={i}>{o}</p>
          ))}
        </div>
      )}
      <AiNavigationAction action={{ label: "Teknisyenler'de Aç", href: AI_ROUTES.technicians() }} />
    </div>
  );
}
