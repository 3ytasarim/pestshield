"use client";

import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { AI_ROUTES } from "@/lib/ai/routes";
import { AiNavigationAction } from "@/components/ai-assistant/ai-navigation-action";
import type { AiPaymentRow } from "@/lib/ai/types";

export function AiPaymentTable({ payments }: { payments: AiPaymentRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-lg border border-border/60">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 text-left text-[10px] text-muted-foreground uppercase">
              <th className="px-3 py-1.5 font-medium">Müşteri</th>
              <th className="px-3 py-1.5 font-medium">Vade</th>
              <th className="px-3 py-1.5 text-right font-medium">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.invoiceNo} className="border-t border-border/40">
                <td className="px-3 py-1.5">
                  <p className="font-medium text-foreground">{p.customerName}</p>
                  <p className="text-[10px] text-muted-foreground">{p.invoiceNo}</p>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">{formatDate(p.dueDate)}</td>
                <td className="px-3 py-1.5 text-right font-semibold whitespace-nowrap text-foreground">{formatCurrency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AiNavigationAction action={{ label: "Tahsilatlar'da Aç", href: AI_ROUTES.collections() }} />
    </div>
  );
}
