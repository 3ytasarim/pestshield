"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/components/dashboard/shared";

interface CollectionSummaryCardProps {
  totalAmount: number;
  overdueAmount: number;
  dueThisWeek: number;
  trend: number[];
  delay?: number;
}

export function CollectionSummaryCard({
  totalAmount,
  overdueAmount,
  dueThisWeek,
  trend,
  delay = 0,
}: CollectionSummaryCardProps) {
  const chartData = trend.map((value, index) => ({ index, value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="h-full overflow-hidden border-none bg-gradient-to-br from-[#0d8fd9] to-[#0a3d75] text-white shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/75">Bekleyen Tahsilatlar</CardTitle>
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(totalAmount)}</div>
                <div className="text-xs text-white/70">Toplam Bekleyen</div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-lg bg-white/10 px-2 py-1">
                  <div className="text-sm font-semibold tabular-nums text-rose-200">
                    {formatCurrency(overdueAmount)}
                  </div>
                  <div className="text-[10px] text-white/60">Gecikmiş</div>
                </div>
                <div className="rounded-lg bg-white/10 px-2 py-1">
                  <div className="text-sm font-semibold tabular-nums text-amber-200">
                    {formatCurrency(dueThisWeek)}
                  </div>
                  <div className="text-[10px] text-white/60">Bu Hafta Vadesi</div>
                </div>
              </div>
            </div>
            <div className="h-16 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="collectionTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="url(#collectionTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
