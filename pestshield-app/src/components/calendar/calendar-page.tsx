"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Download, ListChecks, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import type { WorkOrder } from "@/lib/mock/crm";
import { downloadIcsFile, generateIcsContent } from "@/lib/integrations/google-calendar";
import { cn } from "@/lib/utils";

interface GoogleCalendarStatus {
  connected: boolean;
  calendarId?: string;
  calendarName?: string | null;
}

type CalendarOrder = WorkOrder & { customerName: string | undefined };

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [connection, setConnection] = useState<GoogleCalendarStatus | null>(null);
  const [orders, setOrders] = useState<CalendarOrder[]>([]);

  useEffect(() => {
    fetch("/api/integrations/google-calendar")
      .then((res) => (res.ok ? res.json() : { connected: false }))
      .then(setConnection)
      .catch(() => setConnection({ connected: false }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/crm/work-orders").then((res) => (res.ok ? res.json() : { workOrders: [] })),
      fetch("/api/crm/customers").then((res) => (res.ok ? res.json() : { customers: [] })),
    ])
      .then(([workOrdersData, customersData]: [{ workOrders: WorkOrder[] }, { customers: { id: string; companyName: string }[] }]) => {
        if (cancelled) return;
        const nameById = new Map(customersData.customers.map((c) => [c.id, c.companyName]));
        setOrders(workOrdersData.workOrders.map((o) => ({ ...o, customerName: nameById.get(o.customerId) })));
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const days = useMemo(() => monthGrid(baseDate.getFullYear(), baseDate.getMonth()), [baseDate]);

  const ordersByDay = useMemo(() => {
    const map = new Map<string, typeof orders>();
    orders.forEach((o) => {
      const list = map.get(o.plannedDate) ?? [];
      list.push(o);
      map.set(o.plannedDate, list);
    });
    return map;
  }, [orders]);

  const thisMonthCount = useMemo(
    () => orders.filter((o) => new Date(o.plannedDate).getMonth() === baseDate.getMonth() && new Date(o.plannedDate).getFullYear() === baseDate.getFullYear()).length,
    [orders, baseDate],
  );

  const todayCount = useMemo(() => (ordersByDay.get(toKey(new Date())) ?? []).length, [ordersByDay]);

  function exportIcs() {
    const content = generateIcsContent(orders);
    downloadIcsFile("pestshield-servis-takvimi.ics", content);
    toast.success("Takvim dosyası indirildi (.ics)");
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Takvim</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Tüm servis iş emirlerinin aylık takvim görünümü.</p>
        </div>
        <Button variant="outline" onClick={exportIcs}>
          <Download className="size-4" />
          .ics Olarak İndir
        </Button>
      </motion.div>

      {connection?.connected ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Google Calendar ile bağlı — <span className="font-mono text-xs">{connection.calendarName ?? connection.calendarId}</span> takvimine senkronize.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <span className="flex items-center gap-2.5">
            <Plug className="size-4 shrink-0" />
            Google Calendar&apos;a henüz bağlı değilsiniz — iş emirleri otomatik senkronize edilmiyor.
          </span>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/dashboard/client/integrations" />}>
            Bağlan
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Bu Ay Planlanan" value={thisMonthCount} description="Seçili aydaki servis sayısı" changePercent={5} icon={CalendarDays} accent="blue" delay={0.05} />
        <CrmKpiCard label="Bugün" value={todayCount} description="Bugüne planlanmış servisler" changePercent={4} icon={ListChecks} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Toplam İş Emri" value={orders.length} description="Tüm müşteriler genelinde" changePercent={4} icon={CalendarDays} accent="purple" delay={0.15} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setMonthOffset((m) => m - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold text-foreground capitalize">{baseDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</p>
          <Button variant="outline" size="icon-sm" onClick={() => setMonthOffset((m) => m + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
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
          {days.map((day, i) => {
            const inMonth = day.getMonth() === baseDate.getMonth();
            const isToday = toKey(day) === toKey(new Date());
            const dayOrders = ordersByDay.get(toKey(day)) ?? [];
            return (
              <div
                key={i}
                className={cn(
                  "flex min-h-[96px] flex-col gap-1 border-r border-b border-border/40 p-1.5 last:border-r-0",
                  !inMonth && "bg-muted/10",
                  i % 7 === 6 && "border-r-0",
                )}
              >
                <span className={cn("text-xs font-medium", isToday ? "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50")}>
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {dayOrders.slice(0, 2).map((order) => (
                    <div key={order.id} className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary" title={`${order.customerName} — ${order.serviceType}`}>
                      {order.customerName}
                    </div>
                  ))}
                  {dayOrders.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayOrders.length - 2} daha</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {todayCount > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Bugünün Servisleri</h2>
          {(ordersByDay.get(toKey(new Date())) ?? []).map((order) => (
            <Card key={order.id} className="rounded-xl border-border/60">
              <CardContent className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.serviceType} · {order.technician}
                  </p>
                </div>
                <WorkOrderStatusBadge status={order.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
