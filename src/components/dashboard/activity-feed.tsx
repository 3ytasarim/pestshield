"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  UserPlus,
  FileText,
  CircleDollarSign,
  ScanLine,
  AlertCircle,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityType } from "@/lib/mock/dashboard";

interface ActivityFeedProps {
  items: ActivityItem[];
  delay?: number;
}

const TYPE_ICON: Record<ActivityType, typeof CheckCircle2> = {
  service_completed: CheckCircle2,
  customer_added: UserPlus,
  offer_sent: FileText,
  payment_received: CircleDollarSign,
  station_checked: ScanLine,
  corrective_action_opened: AlertCircle,
};

const TYPE_COLOR: Record<ActivityType, string> = {
  service_completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  customer_added: "bg-primary/10 text-primary",
  offer_sent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  payment_received: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  station_checked: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  corrective_action_opened: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function ActivityFeed({ items, delay = 0 }: ActivityFeedProps) {
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
              <History className="size-4 text-primary" />
            </div>
            <CardTitle>Son Hareketler</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1">
            {items.map((item, index) => {
              const Icon = TYPE_ICON[item.type];
              return (
                <li key={item.id} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        TYPE_COLOR[item.type],
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    {index < items.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="flex flex-1 flex-col pb-1">
                    <span className="text-sm text-foreground/90">{item.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.actor} · {item.timeAgo}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
