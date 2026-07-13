"use client";

import { Droplets, MapPinOff, Wind } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getWeatherIcon } from "@/components/dashboard/weather-icon";
import type { WeatherState } from "@/hooks/use-weather";

interface WeatherWidgetProps {
  state: WeatherState;
}

/** Üst bar için kompakt hava durumu widget'ı. */
export function WeatherWidget({ state }: WeatherWidgetProps) {
  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  if (state.status === "denied" || state.status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPinOff className="size-4" />
        <span>
          {state.status === "denied"
            ? "Konum izni verilmedi. Hava durumu gösterilemiyor."
            : "Hava durumu şu anda alınamıyor."}
        </span>
      </div>
    );
  }

  const { data } = state;
  const Icon = getWeatherIcon(data.weatherCode);

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">
          {data.temperature}°C · {data.label}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Droplets className="size-3" />
            %{data.humidity}
          </span>
          <span className="flex items-center gap-1">
            <Wind className="size-3" />
            {data.windSpeed} km/s
          </span>
        </span>
      </div>
    </div>
  );
}
