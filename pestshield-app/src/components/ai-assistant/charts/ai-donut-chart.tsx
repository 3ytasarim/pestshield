"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AiChartContainer } from "@/components/ai-assistant/charts/ai-chart-container";
import type { AiChartSpec } from "@/lib/ai/types";

const COLORS = ["#0877b2", "#d97706", "#7c3aed", "#059669", "#dc2626", "#64748b"];

export function AiDonutChart({ spec }: { spec: AiChartSpec }) {
  const points = spec.series[0]?.points ?? [];
  const hasData = points.some((p) => p.value > 0);
  const summary = hasData ? `${spec.title}: ${points.map((p) => `${p.label} ${p.value}`).join(", ")}` : `${spec.title}: veri yok`;

  return (
    <AiChartContainer title={spec.title} hasData={hasData}>
      <div role="img" aria-label={summary} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={points} dataKey="value" nameKey="label" innerRadius={32} outerRadius={54} paddingAngle={2}>
              {points.map((p, i) => (
                <Cell key={p.label} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", backgroundColor: "var(--card)", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </AiChartContainer>
  );
}
