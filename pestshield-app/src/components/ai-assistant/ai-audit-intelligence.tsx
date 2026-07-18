"use client";

import { ShieldAlert } from "lucide-react";
import { AiDataQualityBadge } from "@/components/ai-assistant/ai-data-quality-badge";
import { cn } from "@/lib/utils";
import type { AiAuditIntelligenceData } from "@/lib/ai/types";

export function AiAuditIntelligence({ data }: { data: AiAuditIntelligenceData }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase">Denetim Hazırlık Göstergesi</p>
        <AiDataQualityBadge dataQuality={data.dataQuality} />
      </div>

      {data.overallScorePercent !== null && (
        <div className="rounded-xl border border-border/60 bg-card px-3 py-3 text-center">
          <p className="text-2xl font-bold text-foreground">%{data.overallScorePercent}</p>
          <p className="text-[10px] text-muted-foreground">Genel Gösterge</p>
        </div>
      )}

      <ul className="flex flex-col gap-1.5" role="list">
        {data.factors.map((f) => (
          <li key={f.standard} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{f.standard}</span>
              <span className={cn("font-semibold", (f.scorePercent ?? 0) >= 80 ? "text-success" : (f.scorePercent ?? 0) >= 50 ? "text-amber-600 dark:text-amber-400" : "text-destructive")}>
                {f.scorePercent !== null ? `%${f.scorePercent}` : "—"}
              </span>
            </div>
            <p className="mt-0.5 text-muted-foreground">
              {f.compliant} uygun · {f.nonCompliant} uygunsuz · {f.pending} beklemede
            </p>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        <span>{data.disclaimer} (Formül: {data.scoreFormulaVersion})</span>
      </div>
    </div>
  );
}
