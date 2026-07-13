"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CloudSun, Droplets, MapPinOff, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { getWeatherIcon } from "@/components/dashboard/weather-icon";
import { pestRiskNote } from "@/lib/weather";
import { cn } from "@/lib/utils";
import type { WeatherState } from "@/hooks/use-weather";

interface WeatherForecastCardProps {
  state: WeatherState;
  delay?: number;
}

export function WeatherForecastCard({ state, delay = 0 }: WeatherForecastCardProps) {
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
              <CloudSun className="size-4 text-primary" />
            </div>
            <CardTitle>Hava Durumu</CardTitle>
          </div>
          <CardDescription>Konumunuza göre 5 günlük tahmin</CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === "loading" && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </div>
          )}

          {(state.status === "denied" || state.status === "error") && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <MapPinOff className="size-6" />
              <span>
                {state.status === "denied"
                  ? "Konum izni verilmedi. Hava durumu gösterilemiyor."
                  : "Hava durumu şu anda alınamıyor."}
              </span>
            </div>
          )}

          {state.status === "ready" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const Icon = getWeatherIcon(state.data.weatherCode);
                  return <Icon className="size-12 text-primary" />;
                })()}
                <div>
                  <div className="text-3xl font-bold tabular-nums">{state.data.temperature}°C</div>
                  <div className="text-sm text-muted-foreground">{state.data.label}</div>
                </div>
                <div className="ml-auto flex flex-col gap-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="size-3.5" />
                    Nem %{state.data.humidity}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Wind className="size-3.5" />
                    Rüzgar {state.data.windSpeed} km/s
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {state.data.daily.map((day) => {
                  const DayIcon = getWeatherIcon(day.weatherCode);
                  return (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 p-2.5 text-center"
                    >
                      <span className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(
                          new Date(day.date),
                        )}
                      </span>
                      <DayIcon className="size-5 text-primary" />
                      <span className="text-xs font-semibold tabular-nums">
                        {day.tempMax}° / {day.tempMin}°
                      </span>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const note = pestRiskNote(state.data);
                if (!note) return null;
                return (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>{note}</span>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
