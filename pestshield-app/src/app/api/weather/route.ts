import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ message: "Geçersiz konum" }, { status: 400 });
  }

  const weather = await getWeather(lat, lon);
  return NextResponse.json(weather);
}
