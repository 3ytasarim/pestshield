"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { Sparkline, buildTrendSeries } from "@/components/dashboard/sparkline";
import { cn } from "@/lib/utils";
import type { KpiAccent } from "@/components/dashboard/kpi-card";

interface CrmKpiCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  description: string;
  changePercent: number;
  icon: LucideIcon;
  accent?: KpiAccent;
  delay?: number;
}

const ACCENT_ICON_CLASS: Record<KpiAccent, string> = {
  blue: "bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10",
  purple:
    "bg-gradient-to-br from-violet-600/15 to-violet-600/5 text-violet-600 ring-1 ring-violet-600/10 dark:text-violet-400",
  amber:
    "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-amber-500/10 dark:text-amber-400",
  emerald:
    "bg-gradient-to-br from-emerald-600/15 to-emerald-600/5 text-emerald-600 ring-1 ring-emerald-600/10 dark:text-emerald-400",
};

const ACCENT_GLOW_CLASS: Record<KpiAccent, string> = {
  blue: "bg-primary",
  purple: "bg-violet-600",
  amber: "bg-amber-500",
  emerald: "bg-emerald-600",
};

const ACCENT_HEX: Record<KpiAccent, string> = {
  blue: "#0877b2",
  purple: "#7c3aed",
  amber: "#d97706",
  emerald: "#059669",
};

const ACCENT_BAR_CLASS: Record<KpiAccent, string> = {
  blue: "bg-primary",
  purple: "bg-violet-600",
  amber: "bg-amber-500",
  emerald: "bg-emerald-600",
};

export function CrmKpiCard({
  label,
  value,
  format,
  description,
  changePercent,
  icon: Icon,
  accent = "blue",
  delay = 0,
}: CrmKpiCardProps) {
  const isPositive = changePercent >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trend = buildTrendSeries(value || 1);
  const barWidth = Math.min(100, Math.max(8, Math.round((Math.abs(changePercent) / 25) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn(GLASS_CARD, "relative h-full overflow-hidden rounded-2xl")}>
        <div
          className={cn(
            "pointer-events-none absolute -top-8 -right-8 size-28 rounded-full opacity-[0.12] blur-2xl",
            ACCENT_GLOW_CLASS[accent],
          )}
        />
        <CardContent className="relative flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.35, delay: delay + 0.1, type: "spring", stiffness: 260, damping: 18 }}
                  className={cn("flex size-9 items-center justify-center rounded-xl", ACCENT_ICON_CLASS[accent])}
                >
                  <Icon className="size-4.5" />
                </motion.div>
                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[1.75rem] font-semibold tracking-tight tabular-nums">
                  <AnimatedNumber value={value} format={format} />
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  <TrendIcon className="size-3.5" />
                  %{Math.abs(changePercent)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
            <Sparkline data={trend} color={ACCENT_HEX[accent]} className="h-10 w-16 shrink-0" />
          </div>

          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn("h-full rounded-full", ACCENT_BAR_CLASS[accent])}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
