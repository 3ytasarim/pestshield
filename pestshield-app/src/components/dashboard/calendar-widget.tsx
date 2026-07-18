"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/mock/dashboard";

interface CalendarWidgetProps {
  today: Appointment[];
  upcoming: Appointment[];
  delay?: number;
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{appointment.customerName}</span>
        <span className="text-xs text-muted-foreground">{appointment.serviceType}</span>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Clock className="size-3" />
          {appointment.timeSlot}
        </span>
        <span className="flex items-center gap-1">
          <User className="size-3" />
          {appointment.technicianName}
        </span>
      </div>
    </div>
  );
}

export function CalendarWidget({ today, upcoming, delay = 0 }: CalendarWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card className={cn(GLASS_CARD, "h-full")}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="size-4 text-primary" />
            </div>
            <CardTitle>Takvim</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bugün
              </span>
              <Badge variant="secondary" className="rounded-full">
                {today.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {today.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/60 py-4 text-center text-xs text-muted-foreground">
                  Bugün için planlanmış servis yok
                </p>
              ) : (
                today.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} />)
              )}
            </div>
          </div>
          {upcoming.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Yaklaşan
              </span>
              <div className="flex flex-col gap-2">
                {upcoming.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
