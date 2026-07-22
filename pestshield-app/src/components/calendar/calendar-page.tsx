"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Download, Import, ListChecks, Plug } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { WorkOrderStatusBadge } from "@/components/crm/crm-badges";
import { CalendarTimeGrid } from "@/components/calendar/calendar-time-grid";
import { SERVICE_TYPE_OPTIONS } from "@/components/crm/crm-labels";
import type { WorkOrder } from "@/lib/mock/crm";
import { downloadIcsFile, generateIcsContent } from "@/lib/integrations/google-calendar";
import { toKey, googleEventDayKey, monthGrid, startOfWeek, addDays, startOfDay } from "@/lib/calendar/date-utils";
import type { MergedGoogleEvent } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

interface PendingImportEvent {
  googleEventId: string;
  calendarId: string;
  technicianId: string;
  technicianName: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  suggestedCustomerId: string | null;
  suggestedCustomerName: string | null;
}

interface GoogleCalendarStatus {
  connected: boolean;
  calendarId?: string;
  calendarName?: string | null;
}

type CalendarOrder = WorkOrder & { customerName: string | undefined };
type ViewMode = "month" | "week" | "day";

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "month", label: "Ay" },
  { value: "week", label: "Hafta" },
  { value: "day", label: "Gün" },
];

function eventAccentStyle(color?: string): React.CSSProperties {
  if (!color) return {};
  return { backgroundColor: `${color}26`, borderColor: color };
}

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [connection, setConnection] = useState<GoogleCalendarStatus | null>(null);
  const [orders, setOrders] = useState<CalendarOrder[]>([]);
  const [googleEvents, setGoogleEvents] = useState<MergedGoogleEvent[]>([]);
  const [customers, setCustomers] = useState<{ id: string; companyName: string }[]>([]);
  const [pendingImports, setPendingImports] = useState<PendingImportEvent[]>([]);
  const [importDrafts, setImportDrafts] = useState<Record<string, { customerId: string; serviceType: string }>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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
        setCustomers(customersData.customers);
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

  const monthDays = useMemo(() => monthGrid(baseDate.getFullYear(), baseDate.getMonth()), [baseDate]);

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), weekOffset * 7), [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const selectedDay = useMemo(() => addDays(startOfDay(new Date()), dayOffset), [dayOffset]);

  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    if (viewMode === "month") {
      const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
      return { rangeStart: start, rangeEnd: end, rangeLabel: baseDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) };
    }
    if (viewMode === "week") {
      const end = addDays(weekStart, 7);
      const label = `${weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} — ${addDays(weekStart, 6).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`;
      return { rangeStart: weekStart, rangeEnd: end, rangeLabel: label };
    }
    const end = addDays(selectedDay, 1);
    return { rangeStart: selectedDay, rangeEnd: end, rangeLabel: selectedDay.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) };
  }, [viewMode, baseDate, weekStart, selectedDay]);

  useEffect(() => {
    if (!connection?.connected) {
      setGoogleEvents([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/integrations/google-calendar/events?start=${toKey(rangeStart)}&end=${toKey(rangeEnd)}`)
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data: { events?: MergedGoogleEvent[] }) => {
        if (!cancelled) setGoogleEvents(data.events ?? []);
      })
      .catch(() => {
        if (!cancelled) setGoogleEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [connection?.connected, rangeStart, rangeEnd]);

  useEffect(() => {
    if (!connection?.connected) {
      setPendingImports([]);
      return;
    }
    let cancelled = false;
    fetch("/api/integrations/google-calendar/pending-imports")
      .then((res) => (res.ok ? res.json() : { pending: [] }))
      .then((data: { pending?: PendingImportEvent[] }) => {
        if (cancelled) return;
        const list = data.pending ?? [];
        setPendingImports(list);
        setImportDrafts((prev) => {
          const next = { ...prev };
          for (const item of list) {
            if (!next[item.googleEventId]) {
              next[item.googleEventId] = { customerId: item.suggestedCustomerId ?? "", serviceType: SERVICE_TYPE_OPTIONS[0] };
            }
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setPendingImports([]);
      });
    return () => {
      cancelled = true;
    };
  }, [connection?.connected]);

  function updateDraft(googleEventId: string, patch: Partial<{ customerId: string; serviceType: string }>) {
    setImportDrafts((prev) => {
      const current = prev[googleEventId] ?? { customerId: "", serviceType: SERVICE_TYPE_OPTIONS[0] };
      return { ...prev, [googleEventId]: { ...current, ...patch } };
    });
  }

  async function confirmImport(item: PendingImportEvent) {
    const draft = importDrafts[item.googleEventId];
    if (!draft?.customerId) {
      toast.error("Lütfen müşteri seçin");
      return;
    }
    setConfirmingId(item.googleEventId);
    try {
      const res = await fetch("/api/integrations/google-calendar/pending-imports/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleEventId: item.googleEventId,
          customerId: draft.customerId,
          technicianId: item.technicianId,
          serviceType: draft.serviceType,
          plannedDate: googleEventDayKey(item.start),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "İş Emri oluşturulamadı");
        return;
      }
      toast.success("İş Emri oluşturuldu");
      setPendingImports((prev) => prev.filter((p) => p.googleEventId !== item.googleEventId));
      const customerName = customers.find((c) => c.id === draft.customerId)?.companyName;
      setOrders((prev) => [{ ...data.workOrder, customerName }, ...prev]);
    } catch {
      toast.error("İş Emri oluşturulamadı — sunucuya ulaşılamadı");
    } finally {
      setConfirmingId(null);
    }
  }

  const googleEventsByDay = useMemo(() => {
    const map = new Map<string, MergedGoogleEvent[]>();
    googleEvents.forEach((e) => {
      const key = googleEventDayKey(e.start);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    });
    return map;
  }, [googleEvents]);

  const ordersByDay = useMemo(() => {
    const map = new Map<string, typeof orders>();
    orders.forEach((o) => {
      const list = map.get(o.plannedDate) ?? [];
      list.push(o);
      map.set(o.plannedDate, list);
    });
    return map;
  }, [orders]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => new Date(o.plannedDate).getMonth() === now.getMonth() && new Date(o.plannedDate).getFullYear() === now.getFullYear()).length;
  }, [orders]);

  const todayCount = useMemo(() => (ordersByDay.get(toKey(new Date())) ?? []).length, [ordersByDay]);

  const activeOffset = viewMode === "month" ? monthOffset : viewMode === "week" ? weekOffset : dayOffset;

  function goPrev() {
    if (viewMode === "month") setMonthOffset((m) => m - 1);
    else if (viewMode === "week") setWeekOffset((w) => w - 1);
    else setDayOffset((d) => d - 1);
  }
  function goNext() {
    if (viewMode === "month") setMonthOffset((m) => m + 1);
    else if (viewMode === "week") setWeekOffset((w) => w + 1);
    else setDayOffset((d) => d + 1);
  }
  function goToday() {
    setMonthOffset(0);
    setWeekOffset(0);
    setDayOffset(0);
  }

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
          <p className="max-w-xl text-sm text-muted-foreground">Tüm servis iş emirlerinin ay, hafta veya gün görünümü.</p>
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

      {pendingImports.length > 0 && (
        <Card className="rounded-2xl border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <Import className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Bekleyen İçe Aktarımlar ({pendingImports.length})</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Google Calendar&apos;da teknisyen takvimlerine eklenmiş, henüz İş Emri&apos;ne dönüştürülmemiş etkinlikler. Müşteriyi onaylayıp İş Emri oluşturun.
            </p>
            <div className="flex flex-col gap-2.5">
              {pendingImports.map((item) => {
                const draft = importDrafts[item.googleEventId] ?? { customerId: item.suggestedCustomerId ?? "", serviceType: SERVICE_TYPE_OPTIONS[0] };
                return (
                  <div key={item.googleEventId} className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-background p-3 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground" title={item.summary}>
                        {item.summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.technicianName} · {new Date(item.start).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <Select value={draft.customerId} onValueChange={(v) => updateDraft(item.googleEventId, { customerId: String(v) })}>
                      <SelectTrigger className="h-9 w-full rounded-lg px-3 sm:w-48">
                        <SelectValue placeholder="Müşteri seçin…">
                          {(value: unknown) => customers.find((c) => c.id === value)?.companyName ?? "Müşteri seçin…"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={draft.serviceType} onValueChange={(v) => updateDraft(item.googleEventId, { serviceType: String(v) })}>
                      <SelectTrigger className="h-9 w-full rounded-lg px-3 sm:w-44">
                        <SelectValue>{() => draft.serviceType}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" loading={confirmingId === item.googleEventId} onClick={() => confirmImport(item)}>
                      İş Emri Oluştur
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Bu Ay Planlanan" value={thisMonthCount} description="Bu ayki servis sayısı" changePercent={5} icon={CalendarDays} accent="blue" delay={0.05} />
        <CrmKpiCard label="Bugün" value={todayCount} description="Bugüne planlanmış servisler" changePercent={4} icon={ListChecks} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Toplam İş Emri" value={orders.length} description="Tüm müşteriler genelinde" changePercent={4} icon={CalendarDays} accent="purple" delay={0.15} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goPrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold text-foreground capitalize">{rangeLabel}</p>
          <Button variant="outline" size="icon-sm" onClick={goNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={goToday}>
              {viewMode === "month" ? "Bu Ay" : viewMode === "week" ? "Bu Hafta" : "Bugün"}
            </Button>
          )}
          <div className="flex items-center rounded-lg border border-border/60 p-0.5">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setViewMode(mode.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  viewMode === mode.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {connection?.connected && (
            <div className="hidden items-center gap-3 text-[11px] text-muted-foreground lg:flex">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-primary/40" />
                PestShield İş Emri
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm border border-dashed border-border" />
                Google Calendar (salt-okunur)
              </span>
            </div>
          )}
        </div>
      </div>

      {viewMode === "month" ? (
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
              const dayGoogleEvents = googleEventsByDay.get(toKey(day)) ?? [];
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
                    {dayGoogleEvents.slice(0, 2).map((event) =>
                      event.htmlLink ? (
                        <a
                          key={event.id}
                          href={event.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate rounded border border-dashed px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:opacity-80"
                          style={eventAccentStyle(event.color)}
                          title={`${event.summary} — Google Calendar (${event.calendarName})`}
                        >
                          {event.summary}
                        </a>
                      ) : (
                        <div
                          key={event.id}
                          className="truncate rounded border border-dashed px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          style={eventAccentStyle(event.color)}
                          title={`${event.summary} — Google Calendar (${event.calendarName})`}
                        >
                          {event.summary}
                        </div>
                      ),
                    )}
                    {dayGoogleEvents.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayGoogleEvents.length - 2} Google</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <CalendarTimeGrid days={viewMode === "week" ? weekDays : [selectedDay]} orders={orders} googleEvents={googleEvents} />
      )}

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
