"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { cn } from "@/lib/utils";

export interface KpiStat {
  label: string;
  value: string;
  numericValue?: number;
  format?: (value: number) => string;
  tone?: "default" | "success" | "warning" | "destructive";
}

export type KpiAccent = "blue" | "purple" | "amber" | "emerald";

interface KpiCardProps {
  title: string;
  icon: LucideIcon;
  stats: KpiStat[];
  accent?: KpiAccent;
  delay?: number;
}

const TONE_CLASS: Record<NonNullable<KpiStat["tone"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-destructive",
};

const ACCENT_CLASS: Record<KpiAccent, string> = {
  blue: "bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10",
  purple:
    "bg-gradient-to-br from-violet-600/15 to-violet-600/5 text-violet-600 ring-1 ring-violet-600/10 dark:text-violet-400",
  amber:
    "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-amber-500/10 dark:text-amber-400",
  emerald:
    "bg-gradient-to-br from-emerald-600/15 to-emerald-600/5 text-emerald-600 ring-1 ring-emerald-600/10 dark:text-emerald-400",
};

const ACCENT_BORDER: Record<KpiAccent, string> = {
  blue: "before:bg-primary",
  purple: "before:bg-violet-600",
  amber: "before:bg-amber-500",
  emerald: "before:bg-emerald-600",
};

const ACCENT_GLOW: Record<KpiAccent, string> = {
  blue: "bg-primary",
  purple: "bg-violet-600",
  amber: "bg-amber-500",
  emerald: "bg-emerald-600",
};

export function KpiCard({ title, icon: Icon, stats, accent = "blue", delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        className={cn(
          GLASS_CARD,
          "relative h-full overflow-hidden rounded-2xl before:absolute before:inset-x-0 before:top-0 before:h-1",
          ACCENT_BORDER[accent],
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-[0.12] blur-2xl",
            ACCENT_GLOW[accent],
          )}
        />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <motion.div
            initial={{ scale: 0, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, delay: delay + 0.1, type: "spring", stiffness: 260, damping: 18 }}
            className={cn("flex size-9 items-center justify-center rounded-xl", ACCENT_CLASS[accent])}
          >
            <Icon className="size-4.5" />
          </motion.div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.15 + index * 0.04 }}
                className="flex flex-col gap-0.5"
              >
                <span className={cn("text-xl font-semibold tabular-nums", TONE_CLASS[stat.tone ?? "default"])}>
                  {stat.numericValue !== undefined ? (
                    <AnimatedNumber value={stat.numericValue} format={stat.format} />
                  ) : (
                    stat.value
                  )}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
