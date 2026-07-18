"use client";

import { ShieldAlert } from "lucide-react";
import { AlertListItem } from "@/components/alerts/alert-list-item";
import { useProactiveAlerts } from "@/lib/ai/alerts/use-proactive-alerts";

/** Faz 4 proaktif uyarı listesi — mevcut Bildirim Merkezi'nin (work_order/contract/stock/vb.) YANINDA, ayrı bir bölüm olarak gösterilir (bkz. final rapor: neden birleştirilmediği). */
export function AlertPanel({ userId, role, maxItems }: { userId: string | undefined; role: "ADMIN" | "TECH" | "CLIENT" | undefined; maxItems?: number }) {
  const { alerts, acknowledge, dismiss, snooze } = useProactiveAlerts(userId, role);
  const visible = maxItems ? alerts.slice(0, maxItems) : alerts;

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
        <ShieldAlert className="size-5 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">Şu an öncelikli bir proaktif uyarı yok.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {visible.map((alert) => (
        <AlertListItem key={alert.id} alert={alert} onAcknowledge={acknowledge} onDismiss={dismiss} onSnooze={snooze} />
      ))}
    </div>
  );
}
