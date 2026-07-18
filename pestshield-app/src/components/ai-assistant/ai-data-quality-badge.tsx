"use client";

import { cn } from "@/lib/utils";
import type { AiDataQuality, AiDataQualityStatus } from "@/lib/ai/types";

const LABELS: Record<AiDataQualityStatus, string> = {
  complete: "Veri yeterli",
  partial: "Kısmi veri",
  insufficient: "Analiz sınırlı",
  unavailable: "Rapor oluşturulamaz",
};

const STYLES: Record<AiDataQualityStatus, string> = {
  complete: "bg-success/10 text-success",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  insufficient: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  unavailable: "bg-destructive/10 text-destructive",
};

export function AiDataQualityBadge({ dataQuality }: { dataQuality: AiDataQuality }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", STYLES[dataQuality.status])} title={dataQuality.limitations.join(" ") || undefined}>
      {LABELS[dataQuality.status]}
    </span>
  );
}
