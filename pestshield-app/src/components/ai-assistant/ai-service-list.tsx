"use client";

import Link from "next/link";
import { formatDate } from "@/components/crm/crm-format";
import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { cn } from "@/lib/utils";
import type { AiServiceRow } from "@/lib/ai/types";

const STATUS_STYLES: Record<AiServiceRow["status"], string> = {
  tamamlandi: "bg-success/15 text-success",
  bekliyor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  gecikti: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<AiServiceRow["status"], string> = {
  tamamlandi: "Tamamlandı",
  bekliyor: "Bekliyor",
  gecikti: "Gecikti",
};

export function AiServiceList({ services, navigateLabel = "Hizmetler'de Aç" }: { services: AiServiceRow[]; navigateLabel?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" role="list">
        {services.map((s) => (
          <li key={s.occurrenceId} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <Link href={AI_ROUTES.customerDetail(s.customerId)} className="font-semibold text-foreground hover:underline">
                {s.customerName}
              </Link>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", STATUS_STYLES[s.status])}>
                {STATUS_LABELS[s.status]}
              </span>
            </div>
            <p className="mt-0.5 text-muted-foreground">{s.serviceName}</p>
            <p className="mt-0.5 text-muted-foreground">
              {formatDate(s.periodDate)} · {s.startTime}–{s.endTime} · {s.personnelName || "Atanmamış"}
            </p>
          </li>
        ))}
      </ul>
      <AiNavigationAction action={{ label: navigateLabel, href: AI_ROUTES.services() }} />
    </div>
  );
}
