"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import type { WorkOrder } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface TechCalendarPageProps {
  orders: (WorkOrder & { customer: { id: string; companyName: string } | null })[];
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TechCalendarPage({ orders }: TechCalendarPageProps) {
  const today = todayStr();

  const groups = useMemo(() => {
    const upcoming = orders
      .filter((o) => o.status !== "cancelled" && o.plannedDate >= today)
      .sort((a, b) => {
        if (a.plannedDate !== b.plannedDate) return a.plannedDate < b.plannedDate ? -1 : 1;
        return (a.plannedStartTime ?? "").localeCompare(b.plannedStartTime ?? "");
      });

    const byDate = new Map<string, typeof upcoming>();
    for (const order of upcoming) {
      const list = byDate.get(order.plannedDate) ?? [];
      list.push(order);
      byDate.set(order.plannedDate, list);
    }
    return Array.from(byDate.entries());
  }, [orders, today]);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays className="size-4" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Takvim</h1>
          <p className="text-xs text-muted-foreground">Bugünden itibaren planlanan iş emirleriniz.</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Planlanan iş yok" description="Önümüzdeki günler için henüz bir iş emri atanmamış." />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([date, dayOrders]) => (
            <div key={date} className="flex flex-col gap-2">
              <p className={cn("text-xs font-semibold", date === today ? "text-primary" : "text-muted-foreground")}>
                {date === today ? "Bugün" : formatDate(date)}
              </p>
              <div className="flex flex-col gap-2">
                {dayOrders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                  >
                    <Card className={cn(GLASS_CARD, "rounded-xl")}>
                      <CardContent className="flex items-center gap-3 py-3">
                        <div className="flex w-12 shrink-0 flex-col items-center justify-center">
                          <span className="text-sm font-bold tabular-nums text-foreground">
                            {order.plannedStartTime ?? "—"}
                          </span>
                          {order.plannedEndTime && (
                            <span className="text-[10px] text-muted-foreground">{order.plannedEndTime}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 border-l border-border/60 pl-3">
                          <p className="truncate text-sm font-medium text-foreground">
                            {order.customer?.companyName ?? "Müşteri"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{order.serviceType}</p>
                        </div>
                        <WorkOrderStatusBadge status={order.status} className="shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
