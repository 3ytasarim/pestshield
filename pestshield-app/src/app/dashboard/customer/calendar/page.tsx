"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import { toKey, monthGrid } from "@/lib/calendar/date-utils";
import { cn } from "@/lib/utils";
import type { WorkOrder } from "@/lib/mock/crm";

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function CustomerPortalCalendarPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    fetch("/api/portal/work-orders")
      .then((res) => (res.ok ? res.json() : { workOrders: [] }))
      .then((data: { workOrders?: WorkOrder[] }) => setOrders(data.workOrders ?? []))
      .catch(() => setOrders([]));
  }, []);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthDays = useMemo(() => monthGrid(baseDate.getFullYear(), baseDate.getMonth()), [baseDate]);
  const monthLabel = baseDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  const ordersByDay = useMemo(() => {
    const map = new Map<string, WorkOrder[]>();
    orders.forEach((o) => {
      const list = map.get(o.plannedDate) ?? [];
      list.push(o);
      map.set(o.plannedDate, list);
    });
    return map;
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Takvim</h1>
        <p className="text-sm text-muted-foreground">İlaçlama firmanızın hesabınız için oluşturduğu planlı servisler.</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => setMonthOffset((m) => m - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-semibold text-foreground capitalize">{monthLabel}</p>
        <Button variant="outline" size="icon-sm" onClick={() => setMonthOffset((m) => m + 1)}>
          <ChevronRight className="size-4" />
        </Button>
        {monthOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMonthOffset(0)}>
            Bu Ay
          </Button>
        )}
      </div>

      <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-sm">
        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30">
          {DAY_LABELS.map((label) => (
            <div key={label} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDays.map((day, i) => {
            const inMonth = day.getMonth() === baseDate.getMonth();
            const isToday = toKey(day) === toKey(new Date());
            const dayOrders = ordersByDay.get(toKey(day)) ?? [];
            return (
              <div
                key={i}
                className={cn(
                  "flex min-h-[110px] flex-col gap-1 border-r border-b border-border/40 p-1.5 last:border-r-0",
                  !inMonth && "bg-muted/10",
                  i % 7 === 6 && "border-r-0",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday
                      ? "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-1">
                  {dayOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg bg-primary/10 px-1.5 py-1 text-[10px] leading-tight text-primary"
                      title={`${order.serviceType} — ${order.technician}`}
                    >
                      <p className="truncate font-semibold">{order.serviceType}</p>
                      <p className="flex items-center gap-1 truncate text-primary/80">
                        <User className="size-2.5 shrink-0" />
                        {order.technician}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {ordersByDay.get(toKey(new Date())) && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Bugünün Servisleri</h2>
          {(ordersByDay.get(toKey(new Date())) ?? []).map((order) => (
            <Card key={order.id} className="flex flex-row items-center justify-between rounded-xl border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{order.serviceType}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="size-3" />
                  {order.technician}
                </p>
              </div>
              <WorkOrderStatusBadge status={order.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
