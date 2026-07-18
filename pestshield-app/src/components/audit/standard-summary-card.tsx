"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { STANDARD_ROUTES } from "@/components/audit/audit-labels";
import {
  STANDARD_DESCRIPTIONS,
  STANDARD_LABELS,
  getOpenFindingsCount,
  getStandardReadiness,
  type ChecklistItem,
  type ComplianceStandard,
} from "@/lib/mock/audit";
import { cn } from "@/lib/utils";

interface StandardSummaryCardProps {
  standard: ComplianceStandard;
  items: ChecklistItem[];
  delay?: number;
}

export function StandardSummaryCard({ standard, items, delay = 0 }: StandardSummaryCardProps) {
  const readiness = getStandardReadiness(standard, items);
  const openFindings = getOpenFindingsCount(standard, items);
  const isReady = readiness >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={STANDARD_ROUTES[standard]}>
        <Card className={cn(GLASS_CARD, "h-full cursor-pointer rounded-2xl")}>
          <CardContent className="flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight">{STANDARD_LABELS[standard]}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{STANDARD_DESCRIPTIONS[standard]}</p>
              </div>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  isReady ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {isReady ? <ShieldCheck className="size-4.5" /> : <ShieldAlert className="size-4.5" />}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-2xl font-bold tabular-nums", isReady ? "text-success" : "text-foreground")}>%{readiness}</span>
              <span className="text-xs text-muted-foreground">uyumluluk</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readiness}%` }}
                transition={{ duration: 0.6, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={cn("h-full rounded-full", isReady ? "bg-success" : "bg-amber-500")}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
              <span className={cn("font-medium", openFindings > 0 ? "text-destructive" : "text-muted-foreground")}>
                {openFindings > 0 ? `${openFindings} açık bulgu` : "Açık bulgu yok"}
              </span>
              <span className="flex items-center gap-1 font-medium text-primary">
                Detaylar
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
