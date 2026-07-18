"use client";

import { formatDate } from "@/components/crm/crm-format";
import type { AiToolResult } from "@/lib/ai/types";

export function AiSourceSummary({ source }: { source: AiToolResult["source"] }) {
  const range = source.dateFrom && source.dateTo && source.dateFrom !== source.dateTo ? `${formatDate(source.dateFrom)} – ${formatDate(source.dateTo)}` : source.dateFrom ? formatDate(source.dateFrom) : null;
  return (
    <p className="mt-2 text-[11px] text-muted-foreground">
      Kaynak: {range ? `${range} tarihli ` : ""}
      {source.recordCount} kayıt.
    </p>
  );
}
