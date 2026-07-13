"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { auditStatusText, type AuditChecklistItem } from "@/lib/mock/dashboard";

interface AuditReadinessCardProps {
  score: number;
  checklist: AuditChecklistItem[];
  delay?: number;
}

function scoreTone(score: number) {
  if (score >= 80) return { ring: "#059669", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 50) return { ring: "#d97706", text: "text-amber-600 dark:text-amber-400" };
  return { ring: "#dc2626", text: "text-destructive" };
}

export function AuditReadinessCard({ score, checklist, delay = 0 }: AuditReadinessCardProps) {
  const tone = scoreTone(score);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

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
              <ShieldCheck className="size-4 text-primary" />
            </div>
            <CardTitle>Denetim Hazırlık Skoru</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <div className="relative flex size-28 shrink-0 items-center justify-center">
              <svg viewBox="0 0 110 110" className="size-28 -rotate-90">
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="9"
                />
                <motion.circle
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke={tone.ring}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold tabular-nums">{score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className={cn("text-sm font-semibold", tone.text)}>{auditStatusText(score)}</span>
              <span className="text-xs text-muted-foreground">
                Son denetim verilerine göre hesaplandı
              </span>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn(!item.done && "text-muted-foreground")}>{item.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
