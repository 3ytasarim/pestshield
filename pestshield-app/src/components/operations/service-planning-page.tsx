"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import { WorkOrderEditDialog } from "@/components/operations/work-order-edit-dialog";
import type { WorkOrder } from "@/lib/mock/crm";
import type { Technician } from "@/lib/mock/operations";
import { Calendar as CalendarIcon, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const TECH_COLOR_PALETTE = ["bg-primary", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-rose-500"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface WorkOrderWithCustomer extends WorkOrder {
  customer: { id: string; companyName: string } | null;
}

export function ServicePlanningPage({
  initialOrders,
  initialTechnicians,
}: {
  initialOrders: WorkOrderWithCustomer[];
  initialTechnicians: Technician[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [orders, setOrders] = useState(initialOrders);
  const [editingOrder, setEditingOrder] = useState<WorkOrderWithCustomer | null>(null);
  const technicians = initialTechnicians;

  const techColors = useMemo(() => {
    const map = new Map<string, string>();
    technicians.forEach((t, i) => map.set(t.name, TECH_COLOR_PALETTE[i % TECH_COLOR_PALETTE.length]));
    return map;
  }, [technicians]);

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), weekOffset * 7), [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const filteredOrders = useMemo(
    () => (technicianFilter === "all" ? orders : orders.filter((o) => o.technician === technicianFilter)),
    [orders, technicianFilter],
  );

  const weekOrders = useMemo(() => {
    const keys = new Set(weekDays.map(toKey));
    return filteredOrders.filter((o) => keys.has(o.plannedDate));
  }, [filteredOrders, weekDays]);

  function ordersForDay(date: Date) {
    return weekOrders.filter((o) => o.plannedDate === toKey(date)).sort((a, b) => a.technician.localeCompare(b.technician));
  }

  const busiestDay = useMemo(() => {
    let best = { label: "—", count: 0 };
    weekDays.forEach((d, i) => {
      const count = ordersForDay(d).length;
      if (count > best.count) best = { label: DAY_LABELS[i], count };
    });
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOrders, weekDays]);

  function handleOrderSaved(updated: WorkOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Servis Planlama</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Teknisyen bazlı haftalık servis takvimi.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Bu Hafta Planlanan" value={weekOrders.length} description="Seçili haftadaki servis sayısı" changePercent={5} icon={CalendarIcon} accent="blue" delay={0.05} />
        <CrmKpiCard label="Aktif Teknisyen" value={technicians.filter((t) => t.status === "active").length} description="Planlamaya dahil edilebilir" changePercent={4} icon={Users} accent="emerald" delay={0.1} />
        <CrmKpiCard label="En Yoğun Gün" value={busiestDay.count} description={busiestDay.label !== "—" ? `${busiestDay.label} günü` : "Bu hafta servis yok"} changePercent={0} icon={ListChecks} accent="amber" delay={0.15} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-medium text-foreground">
            {weekDays[0].toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} —{" "}
            {weekDays[6].toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <Button variant="outline" size="icon-sm" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="size-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Bu Hafta
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTechnicianFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              technicianFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tüm Teknisyenler
          </button>
          {technicians.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTechnicianFilter(t.name)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                technicianFilter === t.name ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              <span className={cn("size-1.5 rounded-full", techColors.get(t.name) ?? "bg-muted-foreground")} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {weekDays.map((day, i) => {
          const dayOrders = ordersForDay(day);
          const isToday = toKey(day) === toKey(new Date());
          return (
            <Card key={i} className={cn(GLASS_CARD, "gap-0 rounded-2xl p-0", isToday && "ring-1 ring-primary/40")}>
              <div className={cn("border-b border-border/60 px-3 py-2.5", isToday && "bg-primary/5")}>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{DAY_LABELS[i]}</p>
                <p className={cn("text-lg font-bold", isToday ? "text-primary" : "text-foreground")}>{day.getDate()}</p>
              </div>
              <div className="flex flex-col gap-2 p-2.5">
                {dayOrders.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-muted-foreground">Servis yok</p>
                ) : (
                  dayOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setEditingOrder(order)}
                      className="rounded-lg border border-border/60 bg-background/60 p-2 text-left text-[11px] transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("size-1.5 shrink-0 rounded-full", techColors.get(order.technician) ?? "bg-muted-foreground")} />
                        <span className="truncate font-medium text-foreground">{order.customer?.companyName}</span>
                      </div>
                      <p className="mt-0.5 truncate text-muted-foreground">{order.serviceType}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-muted-foreground">{order.technician.split(" ")[0]}</span>
                        <WorkOrderStatusBadge status={order.status} className="px-1.5 py-0 text-[9px]" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <WorkOrderEditDialog
        open={editingOrder !== null}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        order={editingOrder}
        technicians={technicians}
        onSaved={handleOrderSaved}
      />
    </div>
  );
}
