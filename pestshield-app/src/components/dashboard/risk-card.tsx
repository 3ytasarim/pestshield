"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RiskItem {
  label: string;
  value: number;
  severity: "high" | "medium";
}

interface RiskCardProps {
  items: RiskItem[];
  delay?: number;
}

const SEVERITY_DOT: Record<RiskItem["severity"], string> = {
  high: "bg-destructive",
  medium: "bg-amber-500",
};

export function RiskCard({ items, delay = 0 }: RiskCardProps) {
  const highCount = items.filter((item) => item.severity === "high" && item.value > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative h-full overflow-hidden border-destructive/20 bg-card/70 shadow-sm backdrop-blur-sm transition-shadow duration-300 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-destructive hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Kritik Riskler</CardTitle>
          <div className="flex items-center gap-2">
            {highCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {highCount} acil
              </Badge>
            )}
            <div className="flex size-9 items-center justify-center rounded-xl bg-destructive text-white shadow-lg shadow-destructive/30">
              <AlertTriangle className="size-4.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2.5">
            {items.map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn("size-1.5 shrink-0 rounded-full", SEVERITY_DOT[item.severity])} />
                  {item.label}
                </span>
                <span className="font-semibold tabular-nums">{item.value}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
