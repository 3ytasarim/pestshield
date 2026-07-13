"use client";

import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/components/dashboard/shared";
import type { ExchangeRatesState } from "@/hooks/use-exchange-rates";

interface ExchangeRateWidgetProps {
  state: ExchangeRatesState;
}

export function ExchangeRateWidget({ state }: ExchangeRateWidgetProps) {
  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="size-4" />
        <span>Kurlar şu anda alınamıyor.</span>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tabular-nums">{data.usdTry.toFixed(2)} ₺</span>
        <span className="text-xs text-muted-foreground">Dolar</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tabular-nums">{data.eurTry.toFixed(2)} ₺</span>
        <span className="text-xs text-muted-foreground">Euro</span>
      </div>
      <div className="hidden text-xs text-muted-foreground sm:block">
        Son güncelleme
        <br />
        {formatTime(data.updatedAt)}
      </div>
    </div>
  );
}
