"use client";

import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import { AlertSeverityBadge } from "@/components/alerts/alert-severity-badge";
import { Button } from "@/components/ui/button";
import type { AlertInstance } from "@/lib/ai/alerts/types";
import type { SnoozeOption } from "@/lib/ai/alerts/alert-actions";

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.round(hours / 24)} gün önce`;
}

export function AlertListItem({
  alert,
  onAcknowledge,
  onDismiss,
  onSnooze,
}: {
  alert: AlertInstance;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, option: SnoozeOption) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/60 px-3.5 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{alert.title}</p>
        <AlertSeverityBadge severity={alert.severity} />
      </div>
      <p className="text-[11px] text-muted-foreground">{alert.description}</p>
      <p className="text-[10px] text-muted-foreground/70">
        {timeAgo(alert.lastDetectedAt)}
        {alert.occurrenceCount > 1 ? ` · ${alert.occurrenceCount}. tespit` : ""}
        {alert.status === "acknowledged" ? " · Onaylandı" : alert.status === "snoozed" ? " · Ertelendi" : ""}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {alert.status === "active" && (
          <Button type="button" size="xs" variant="outline" onClick={() => onAcknowledge(alert.id)}>
            <Check className="size-3" />
            Onayla
          </Button>
        )}
        {(alert.status === "active" || alert.status === "acknowledged") && (
          <Button type="button" size="xs" variant="ghost" onClick={() => onSnooze(alert.id, "tomorrow")}>
            <Clock className="size-3" />
            Yarına Ertele
          </Button>
        )}
        <Button type="button" size="xs" variant="ghost" onClick={() => onDismiss(alert.id)}>
          <X className="size-3" />
          Kapat
        </Button>
        {alert.navigationHref && (
          <Link href={alert.navigationHref} className="ml-auto text-[11px] font-medium text-primary hover:underline">
            İlgili Kaydı Aç
          </Link>
        )}
      </div>
    </div>
  );
}
