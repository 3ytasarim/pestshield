"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import type { PestActivityPoint } from "@/lib/mock/dashboard";

interface PestActivityChartProps {
  data: PestActivityPoint[];
  delay?: number;
}

const SERIES: { key: keyof Omit<PestActivityPoint, "week">; label: string; color: string }[] = [
  { key: "kemirgen", label: "Kemirgen", color: "#0877b2" },
  { key: "hamamboceği", label: "Hamamböceği", color: "#d97706" },
  { key: "ucanHasere", label: "Uçan Haşere", color: "#7c3aed" },
  { key: "karinca", label: "Karınca", color: "#059669" },
];

export function PestActivityChart({ data, delay = 0 }: PestActivityChartProps) {
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
              <TrendingUp className="size-4 text-primary" />
            </div>
            <CardTitle>Haşere Aktivite Trendi</CardTitle>
          </div>
          <CardDescription>Haşere türlerine göre haftalık tespit sayısı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {SERIES.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
