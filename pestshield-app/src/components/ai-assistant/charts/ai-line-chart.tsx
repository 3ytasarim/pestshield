"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AiChartContainer } from "@/components/ai-assistant/charts/ai-chart-container";
import type { AiChartSpec } from "@/lib/ai/types";

const COLORS = ["#0877b2", "#d97706", "#7c3aed", "#059669"];

export function AiLineChart({ spec }: { spec: AiChartSpec }) {
  const series = spec.series.filter((s) => s.points.length > 0);
  const hasData = series.length > 0 && series.some((s) => s.points.some((p) => p.value > 0));
  const data = series[0]?.points.map((p, i) => {
    const row: Record<string, string | number> = { label: p.label };
    series.forEach((s) => (row[s.name] = s.points[i]?.value ?? 0));
    return row;
  });

  const summary = hasData ? `${spec.title}: ${series[0].points.map((p) => `${p.label} ${p.value}`).join(", ")}` : `${spec.title}: veri yok`;

  return (
    <AiChartContainer title={spec.title} hasData={hasData}>
      <div role="img" aria-label={summary} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 11 }} />
            {series.map((s, i) => (
              <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color ?? COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AiChartContainer>
  );
}
