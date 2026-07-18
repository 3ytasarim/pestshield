"use client";

import { formatDate } from "@/components/crm/crm-format";
import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { cn } from "@/lib/utils";
import type { AiCorrectiveActionRow } from "@/lib/ai/types";

export function AiCorrectiveActionList({ correctiveActions }: { correctiveActions: AiCorrectiveActionRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" role="list">
        {correctiveActions.map((a, i) => (
          <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <p className="font-semibold text-foreground">{a.title}</p>
            <p className="mt-0.5 text-muted-foreground">{a.customerName ?? "Genel"} · Sorumlu: {a.responsible}</p>
            <p className={cn("mt-0.5", a.overdue ? "font-semibold text-destructive" : "text-muted-foreground")}>
              Vade: {formatDate(a.dueDate)}
              {a.overdue && " (gecikti)"}
            </p>
          </li>
        ))}
      </ul>
      <AiNavigationAction action={{ label: "Düzeltici Faaliyetler'de Aç", href: AI_ROUTES.correctiveActions() }} />
    </div>
  );
}
