"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { useNotifications } from "@/components/notifications/notifications-context";
import { NOTIFICATION_PRIORITY_STYLES, NOTIFICATION_TYPE_ICONS, NOTIFICATION_TYPE_LABELS } from "@/components/notifications/notification-labels";
import { AlertPanel } from "@/components/alerts/alert-panel";
import type { NotificationType } from "@/lib/mock/notifications";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | NotificationType;
type ReadFilter = "all" | "unread";

export function NotificationCenterPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { data: session } = useSession();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const filtered = useMemo(
    () =>
      notifications.filter((n) => {
        if (typeFilter !== "all" && n.type !== typeFilter) return false;
        if (readFilter === "unread" && n.read) return false;
        return true;
      }),
    [notifications, typeFilter, readFilter],
  );

  const criticalCount = useMemo(() => notifications.filter((n) => n.priority === "critical" || n.priority === "high").length, [notifications]);

  const types = useMemo(() => Array.from(new Set(notifications.map((n) => n.type))), [notifications]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Bildirim Merkezi</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Tüm modüllerden gelen önemli uyarılar tek yerde: gecikmiş kontroller, biten sözleşmeler, kritik stok ve daha fazlası.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="size-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </motion.div>

      <Card className={cn(GLASS_CARD)}>
        <CardHeader>
          <CardTitle className="text-base">Proaktif Uyarılar</CardTitle>
          <p className="text-xs text-muted-foreground">Deterministik kurallardan (gecikmiş servis, gecikmiş tahsilat, kritik risk vb.) üretilen, onaylanabilir/ertelenebilir uyarılar.</p>
        </CardHeader>
        <CardContent className="p-0">
          <AlertPanel userId={session?.user?.id} role={session?.user?.role === "CUSTOMER" ? undefined : session?.user?.role} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Bildirim" value={notifications.length} description="Tüm modüllerden toplanan sinyal" changePercent={5} icon={Bell} accent="blue" delay={0.05} />
        <CrmKpiCard label="Okunmamış" value={unreadCount} description="Henüz görüntülenmedi" changePercent={unreadCount > 0 ? 10 : -10} icon={Inbox} accent="amber" delay={0.1} />
        <CrmKpiCard label="Yüksek Öncelik" value={criticalCount} description="Yüksek veya kritik önem derecesi" changePercent={criticalCount > 0 ? 14 : -14} icon={Bell} accent="emerald" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setReadFilter("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              readFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setReadFilter("unread")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              readFilter === "unread" ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            Okunmamış ({unreadCount})
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              typeFilter === "all" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tüm Kategoriler
          </button>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === type ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {NOTIFICATION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="Bildirim yok" description="Seçili filtrelere uyan bildirim bulunmuyor." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((n, index) => {
            const Icon = NOTIFICATION_TYPE_ICONS[n.type];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.02, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card
                  className={cn(GLASS_CARD, "cursor-pointer rounded-2xl", !n.read && "border-primary/20 bg-primary/[0.03]")}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.link) router.push(n.link);
                  }}
                >
                  <CardContent className="flex items-start gap-3 py-3.5">
                    <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", NOTIFICATION_PRIORITY_STYLES[n.priority])}>
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("text-sm", !n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>{n.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{NOTIFICATION_TYPE_LABELS[n.type]}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
