"use client";

import { useEffect, useState } from "react";
import type { ExchangeRates } from "@/lib/exchange-rates";

export type ExchangeRatesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: ExchangeRates };

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export function useExchangeRates(): ExchangeRatesState {
  const [state, setState] = useState<ExchangeRatesState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/exchange-rates");
        if (!response.ok) throw new Error("exchange rate fetch failed");
        const data: ExchangeRates = await response.json();
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
