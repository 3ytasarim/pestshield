"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/components/notifications/notifications-context";
import { NOTIFICATION_TYPE_ICONS } from "@/components/notifications/notification-labels";
import { AlertPanel } from "@/components/alerts/alert-panel";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.round(hours / 24);
  return `${days} gün önce`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { data: session } = useSession();
  const router = useRouter();
  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative rounded-full" />}>
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border/60">
          <p className="px-3.5 pt-2.5 text-[10px] font-semibold text-muted-foreground uppercase">Proaktif Uyarılar</p>
          <div className="max-h-64 overflow-y-auto">
            <AlertPanel userId={session?.user?.id} role={session?.user?.role} maxItems={4} />
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5">
          <span className="text-sm font-semibold text-foreground">Bildirimler</span>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllAsRead} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <CheckCheck className="size-3.5" />
              Tümünü okundu işaretle
            </button>
          )}
        </div>
        <div className="flex max-h-96 flex-col divide-y divide-border/60 overflow-y-auto">
          {recent.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Bildirim yok</p>
          ) : (
            recent.map((n) => {
              const Icon = NOTIFICATION_TYPE_ICONS[n.type];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.link) router.push(n.link);
                  }}
                  className={cn("flex items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-muted/50", !n.read && "bg-primary/[0.04]")}
                >
                  <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-xs", !n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>{n.title}</p>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })
          )}
        </div>
        <Link href="/dashboard/client/notifications" className="block border-t border-border/60 px-3.5 py-2.5 text-center text-xs font-medium text-primary hover:underline">
          Tüm Bildirimleri Gör
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
