"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color: string;
  className?: string;
}

/** Eksensiz, minimal mini alan grafiği - KPI kartlarında trend göstermek için. */
export function Sparkline({ data, color, className }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  const gradientId = `sparkline-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Bir sayıdan, o sayıya doğru yükselen deterministik (Math.random kullanmayan) sahte seri üretir. */
export function buildTrendSeries(target: number, points = 7): number[] {
  const base = Math.max(target * 0.55, 1);
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1);
    const wave = Math.sin(i * 1.3) * target * 0.06;
    return Math.max(0, Math.round(base + (target - base) * progress + wave));
  });
}
