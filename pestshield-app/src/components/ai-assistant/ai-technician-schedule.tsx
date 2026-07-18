"use client";

import { formatDate } from "@/components/crm/crm-format";
import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import type { AiTechnicianScheduleRow } from "@/lib/ai/types";

export function AiTechnicianSchedule({ schedule }: { schedule: AiTechnicianScheduleRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" role="list">
        {schedule.map((s, i) => (
          <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <p className="font-semibold text-foreground">
              {s.startTime}–{s.endTime} · {s.customerName}
            </p>
            <p className="text-muted-foreground">{s.serviceName} · {formatDate(s.periodDate)}</p>
          </li>
        ))}
      </ul>
      <AiNavigationAction action={{ label: "Servis Planlama'da Aç", href: AI_ROUTES.servicePlanning() }} />
    </div>
  );
}
