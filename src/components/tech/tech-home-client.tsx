"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatDate } from "@/components/crm/crm-format";
import { WorkdayTracker } from "@/components/tech/workday-tracker";
import { NotificationPermissionSheet } from "@/components/tech/notification-permission-sheet";
import type { Customer, WorkOrder } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

interface TechHomeClientProps {
  userName: string;
  orders: (WorkOrder & { customer: Customer | undefined })[];
}

export function TechHomeClient({ userName, orders }: TechHomeClientProps) {
  const stats = useMemo(() => {
    const toplam = orders.length;
    const bekleyen = orders.filter((o) => o.status === "planned" || o.status === "in_progress").length;
    const tekrar = orders.filter((o) => o.status === "delayed").length;
    const tamam = orders.filter((o) => o.status === "completed").length;
    return { toplam, bekleyen, tekrar, tamam };
  }, [orders]);

  const newlyAssigned = useMemo(
    () =>
      orders
        .filter((o) => o.status === "planned")
        .sort((a, b) => (a.plannedDate < b.plannedDate ? -1 : 1))
        .slice(0, 8),
    [orders],
  );

  return (
    <div className="flex flex-col gap-5 pb-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-sm text-muted-foreground">Merhaba,</p>
        <h1 className="text-xl font-bold text-foreground">{userName}</h1>
        <p className="text-xs text-muted-foreground">Saha Personeli · Bugün</p>
      </motion.div>

      <WorkdayTracker />

      <div className="grid grid-cols-5 gap-2">
        {(
          [
            { label: "Toplam", value: stats.toplam, tone: "text-foreground" },
            { label: "Bekleyen", value: stats.bekleyen, tone: "text-amber-600 dark:text-amber-400" },
            { label: "Tekrar", value: stats.tekrar, tone: "text-orange-600 dark:text-orange-400" },
            { label: "Tamam", value: stats.tamam, tone: "text-success" },
            { label: "Tahsilat", value: "0 ₺", tone: "text-primary" },
          ] as const
        ).map((stat) => (
          <Card key={stat.label} className={cn(GLASS_CARD, "rounded-xl p-0")}>
            <CardContent className="flex flex-col items-center gap-0.5 px-1.5 py-3 text-center">
              <p className={cn("text-lg font-bold tabular-nums", stat.tone)}>{stat.value}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="h-4 w-1 rounded-full bg-primary" />
          Yeni Atananlar
        </h2>

        {newlyAssigned.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
            Yeni atanan iş yok
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {newlyAssigned.map((order) => (
              <Card key={order.id} className={cn(GLASS_CARD, "rounded-xl")}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{order.customer?.companyName ?? "Müşteri"}</p>
                    <p className="truncate text-xs text-muted-foreground">{order.serviceType}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-foreground">{formatDate(order.plannedDate)}</p>
                    <p className="text-[10px] text-muted-foreground">{order.orderNo}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NotificationPermissionSheet />
    </div>
  );
}
