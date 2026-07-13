"use client";

import { useEffect, useState } from "react";
import type { WeatherData } from "@/lib/weather";

export type WeatherState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "ready"; data: WeatherData };

/**
 * Konum iznini tarayıcıdan ister ve /api/weather üzerinden hava durumunu
 * çeker. Tek bir hook örneği ile hem üst bar'daki kompakt widget hem de
 * detaylı kart aynı veriyi paylaşır (bkz. DashboardClient) - böylece konum
 * izni yalnızca bir kez istenir.
 */
export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "error" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error("weather fetch failed");
          const data: WeatherData = await response.json();
          setState({ status: "ready", data });
        } catch {
          setState({ status: "error" });
        }
      },
      (error) => {
        setState({
          status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
        });
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  return state;
}
