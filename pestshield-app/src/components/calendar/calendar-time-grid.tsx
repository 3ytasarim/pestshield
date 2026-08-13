"use client";

import { Card } from "@/components/ui/card";
import { toKey, googleEventDayKey } from "@/lib/calendar/date-utils";
import type { MergedGoogleEvent } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";
import type { WorkOrder } from "@/lib/mock/crm";

export type { MergedGoogleEvent };

type CalendarOrder = WorkOrder & { customerName: string | undefined };

interface CalendarTimeGridProps {
  days: Date[];
  orders: CalendarOrder[];
  googleEvents: MergedGoogleEvent[];
}

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABEL_FORMAT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

interface TimedBlock {
  event: MergedGoogleEvent;
  startMin: number;
  endMin: number;
  col: number;
  cols: number;
}

/** Aynı gün içindeki çakışan etkinlikleri yan yana sütunlara yerleştirir (basit greedy algoritma). */
function layoutOverlaps(events: MergedGoogleEvent[]): TimedBlock[] {
  const withTimes = events
    .map((event) => ({ event, startMin: minutesOfDay(event.start), endMin: Math.max(minutesOfDay(event.end), minutesOfDay(event.start) + 15) }))
    .sort((a, b) => a.startMin - b.startMin);

  const columnEnds: number[] = [];
  const placed = withTimes.map(({ event, startMin, endMin }) => {
    let col = columnEnds.findIndex((end) => end <= startMin);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(endMin);
    } else {
      columnEnds[col] = endMin;
    }
    return { event, startMin, endMin, col };
  });

  const cols = columnEnds.length || 1;
  return placed.map((p) => ({ ...p, cols }));
}

function eventAccentStyle(color?: string): React.CSSProperties {
  if (!color) return {};
  return { backgroundColor: `${color}26`, borderColor: color };
}

/** Saati olan bir yerel iş emrini, saatli takvim gridinde Google etkinlikleriyle AYNI şekilde yerleştirebilmek için ortak şekle çevirir. */
function orderToTimedEvent(order: CalendarOrder): MergedGoogleEvent {
  const endTime = order.plannedEndTime ?? order.plannedStartTime!;
  return {
    id: order.id,
    calendarId: "local",
    calendarName: "PestShield",
    summary: `${order.customerName ?? "Müşteri"} — ${order.serviceType}`,
    start: `${order.plannedDate}T${order.plannedStartTime}:00`,
    end: `${order.plannedDate}T${endTime}:00`,
    allDay: false,
  };
}

export function CalendarTimeGrid({ days, orders, googleEvents }: CalendarTimeGridProps) {
  const todayKey = toKey(new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const ordersByDay = new Map<string, CalendarOrder[]>();
  const timedOrdersByDay = new Map<string, MergedGoogleEvent[]>();
  orders.forEach((o) => {
    if (o.plannedStartTime) {
      const list = timedOrdersByDay.get(o.plannedDate) ?? [];
      list.push(orderToTimedEvent(o));
      timedOrdersByDay.set(o.plannedDate, list);
      return;
    }
    const list = ordersByDay.get(o.plannedDate) ?? [];
    list.push(o);
    ordersByDay.set(o.plannedDate, list);
  });

  const allDayGoogleByDay = new Map<string, MergedGoogleEvent[]>();
  const timedGoogleByDay = new Map<string, MergedGoogleEvent[]>();
  googleEvents.forEach((e) => {
    const key = googleEventDayKey(e.start);
    const target = e.allDay ? allDayGoogleByDay : timedGoogleByDay;
    const list = target.get(key) ?? [];
    list.push(e);
    target.set(key, list);
  });

  const gridTemplateColumns = `56px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-sm">
      <div className="grid border-b border-border/60" style={{ gridTemplateColumns }}>
        <div />
        {days.map((day) => {
          const isToday = toKey(day) === todayKey;
          return (
            <div key={toKey(day)} className={cn("border-l border-border/40 px-2 py-2 text-center", isToday && "bg-primary/5")}>
              <p className="text-[11px] font-medium text-muted-foreground capitalize">{day.toLocaleDateString("tr-TR", DAY_LABEL_FORMAT)}</p>
            </div>
          );
        })}
      </div>

      <div className="grid border-b border-border/60" style={{ gridTemplateColumns }}>
        <div className="px-1 py-1.5 text-right text-[10px] text-muted-foreground">Tüm gün</div>
        {days.map((day) => {
          const key = toKey(day);
          const dayOrders = ordersByDay.get(key) ?? [];
          const dayAllDayGoogle = allDayGoogleByDay.get(key) ?? [];
          return (
            <div key={key} className="flex min-h-[32px] flex-col gap-0.5 border-l border-border/40 p-1">
              {dayOrders.map((order) => (
                <div key={order.id} className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary" title={`${order.customerName} — ${order.serviceType}`}>
                  {order.customerName}
                </div>
              ))}
              {dayAllDayGoogle.map((event) =>
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
            </div>
          );
        })}
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns, height: HOURS.length * HOUR_HEIGHT }}>
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="border-t border-border/30 pr-1.5 text-right text-[10px] text-muted-foreground" style={{ height: HOUR_HEIGHT }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((day) => {
            const key = toKey(day);
            const isToday = key === todayKey;
            const dayEvents = [...(timedOrdersByDay.get(key) ?? []), ...(timedGoogleByDay.get(key) ?? [])];
            const blocks = layoutOverlaps(dayEvents);
            return (
              <div key={key} className="relative border-l border-border/40">
                {HOURS.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-border/20" style={{ top: h * HOUR_HEIGHT }} />
                ))}
                {isToday && nowMinutes >= 0 && nowMinutes <= 1440 && (
                  <div className="absolute inset-x-0 z-10 border-t-2 border-destructive" style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }} />
                )}
                {blocks.map((block) => {
                  const isLocal = block.event.calendarId === "local";
                  const style: React.CSSProperties = {
                    top: (block.startMin / 60) * HOUR_HEIGHT,
                    height: Math.max(((block.endMin - block.startMin) / 60) * HOUR_HEIGHT, 18),
                    left: `${(block.col / block.cols) * 100}%`,
                    width: `${100 / block.cols}%`,
                    ...(isLocal ? { backgroundColor: "color-mix(in srgb, var(--primary) 15%, transparent)", borderColor: "var(--primary)" } : eventAccentStyle(block.event.color)),
                  };
                  const className = "absolute overflow-hidden rounded border px-1 py-0.5 text-[10px] font-medium text-foreground hover:z-20 hover:shadow-md";
                  const title = isLocal ? block.event.summary : `${block.event.summary} — Google Calendar (${block.event.calendarName})`;
                  return isLocal ? (
                    <div key={block.event.id} className={className} style={style} title={title}>
                      {block.event.summary}
                    </div>
                  ) : (
                    <a key={block.event.id} href={block.event.htmlLink} target="_blank" rel="noreferrer" className={className} style={style} title={title}>
                      {block.event.summary}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
