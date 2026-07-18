"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate } from "@/components/crm/crm-format";
import { cn } from "@/lib/utils";
import type { AiSourceInfo } from "@/lib/ai/types";

/** Faz 1'deki AiSourceSummary'nin (tek satır) genişletilmiş hali — Faz 2 analizlerinde kayıt türleri/zaman dilimi gibi ek bilgi gösterir. */
export function AiSourceDetails({ source }: { source: AiSourceInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none rounded"
      >
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} aria-hidden="true" />
        Kaynak ayrıntıları
      </button>
      {open && (
        <div className="mt-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
          <p>Kayıt sayısı: {source.recordCount}</p>
          {source.dateFrom && <p>Dönem: {formatDate(source.dateFrom)}{source.dateTo && source.dateTo !== source.dateFrom ? ` – ${formatDate(source.dateTo)}` : ""}</p>}
          {source.recordTypes && source.recordTypes.length > 0 && <p>Kayıt türleri: {source.recordTypes.join(", ")}</p>}
          {source.timezone && <p>Saat dilimi: {source.timezone}</p>}
          {source.generatedAt && <p>Oluşturma: {formatDate(source.generatedAt)}</p>}
        </div>
      )}
    </div>
  );
}
