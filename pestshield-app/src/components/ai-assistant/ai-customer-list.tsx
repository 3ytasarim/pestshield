"use client";

import Link from "next/link";
import { AI_ROUTES } from "@/lib/ai/routes";
import type { AiCustomerListItem } from "@/lib/ai/types";

export function AiCustomerList({ customers }: { customers: AiCustomerListItem[] }) {
  return (
    <ul className="flex flex-col gap-1.5" role="list">
      {customers.map((c) => (
        <li key={c.customerId}>
          <Link
            href={AI_ROUTES.customerDetail(c.customerId)}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div>
              <p className="font-medium text-foreground">{c.companyName}</p>
              <p className="text-[10px] text-muted-foreground">{c.sector} · {c.city}</p>
            </div>
            <span className={c.status === "active" ? "text-success" : "text-muted-foreground"}>{c.status === "active" ? "Aktif" : "Pasif"}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
