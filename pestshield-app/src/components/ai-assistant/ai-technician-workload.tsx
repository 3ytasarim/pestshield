"use client";

import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import type { AiTechnicianWorkloadRow } from "@/lib/ai/types";

export function AiTechnicianWorkload({ workload }: { workload: AiTechnicianWorkloadRow[] }) {
  const max = Math.max(...workload.map((w) => w.serviceCount), 1);
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" role="list">
        {workload.map((w) => (
          <li key={w.technicianName} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{w.technicianName}</span>
              <span className="text-muted-foreground">{w.serviceCount} servis</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(w.serviceCount / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <AiNavigationAction action={{ label: "Teknisyenler'de Aç", href: AI_ROUTES.technicians() }} />
    </div>
  );
}
