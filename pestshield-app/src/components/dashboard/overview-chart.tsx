"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Sprint 0 - Design System örneği: gerçek veri sonraki sprintte bağlanacak.
const PLACEHOLDER_DATA = [
  { month: "Oca", kontroller: 0 },
  { month: "Şub", kontroller: 0 },
  { month: "Mar", kontroller: 0 },
  { month: "Nis", kontroller: 0 },
  { month: "May", kontroller: 0 },
  { month: "Haz", kontroller: 0 },
];

export function OverviewChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aylık Kontrol Trendi</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={PLACEHOLDER_DATA}>
            <defs>
              <linearGradient id="kontrollerFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                borderColor: "var(--color-border)",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="kontroller"
              stroke="var(--color-primary)"
              fill="url(#kontrollerFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
