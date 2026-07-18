"use client";

import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import { cn } from "@/lib/utils";
import type { AiCustomerCard as AiCustomerCardType } from "@/lib/ai/types";

const RISK_LEVEL_STYLES: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  critical: "bg-destructive/15 text-destructive",
};

export function AiCustomerCard({ customer }: { customer: AiCustomerCardType }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{customer.companyName}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", RISK_LEVEL_STYLES[customer.riskLevel] ?? "bg-muted text-muted-foreground")}>
            {customer.riskLevel}
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">
          {customer.sector} · {customer.city} · {customer.branchCount} şube
        </p>
        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
          <span className="text-muted-foreground">Cari Bakiye</span>
          <span className={cn("font-semibold", customer.pendingCollection > 0 ? "text-destructive" : "text-success")}>
            {formatCurrency(customer.pendingCollection)}
          </span>
        </div>
        {customer.contractEndDate && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Sözleşme Bitişi</span>
            <span className="text-foreground">{formatDate(customer.contractEndDate)}</span>
          </div>
        )}
      </div>
      <AiNavigationAction action={{ label: "Müşteriyi Aç", href: AI_ROUTES.customerDetail(customer.customerId) }} />
    </div>
  );
}
