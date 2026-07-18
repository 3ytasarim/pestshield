"use client";

import { formatDate } from "@/components/crm/crm-format";
import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import type { AiContractRow } from "@/lib/ai/types";

export function AiContractList({ contracts }: { contracts: AiContractRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" role="list">
        {contracts.map((c) => (
          <li key={c.customerName} className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
            <span className="font-medium text-foreground">{c.customerName}</span>
            <span className="text-muted-foreground">{formatDate(c.contractEndDate)} · {c.daysRemaining} gün kaldı</span>
          </li>
        ))}
      </ul>
      <AiNavigationAction action={{ label: "Sözleşmeler'de Aç", href: AI_ROUTES.contracts() }} />
    </div>
  );
}
