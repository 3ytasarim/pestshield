export interface DailyForecast {
  date: string;
  weatherCode: number;
  label: string;
  tempMax: number;
  tempMin: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  label: string;
  humidity: number;
  windSpeed: number;
  daily: DailyForecast[];
  source: "live" | "mock";
}

/** WMO weather codes (Open-Meteo) -> Turkish description. */
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Açık",
  1: "Genellikle Açık",
  2: "Parçalı Bulutlu",
  3: "Kapalı",
  45: "Sisli",
  48: "Kırağı Sisi",
  51: "Hafif Çisenti",
  53: "Çisenti",
  55: "Yoğun Çisenti",
  56: "Dondurucu Çisenti",
  57: "Yoğun Dondurucu Çisenti",
  61: "Hafif Yağmur",
  63: "Yağmurlu",
  65: "Şiddetli Yağmur",
  66: "Dondurucu Yağmur",
  67: "Şiddetli Dondurucu Yağmur",
  71: "Hafif Kar",
  73: "Kar Yağışlı",
  75: "Yoğun Kar Yağışlı",
  77: "Kar Taneleri",
  80: "Sağanak Yağmur",
  81: "Kuvvetli Sağanak",
  82: "Şiddetli Sağanak",
  85: "Hafif Kar Sağanağı",
  86: "Yoğun Kar Sağanağı",
  95: "Gök Gürültülü Fırtına",
  96: "Dolu ile Fırtına",
  99: "Şiddetli Dolulu Fırtına",
};

export function weatherLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "Bilinmiyor";
}

function buildMockWeather(): WeatherData {
  const today = new Date();
  const daily: DailyForecast[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i + 1);
    const code = [1, 2, 61, 0, 3][i % 5];
    return {
      date: date.toISOString().slice(0, 10),
      weatherCode: code,
      label: weatherLabel(code),
      tempMax: 26 - i,
      tempMin: 17 - i,
    };
  });

  return {
    temperature: 24,
    weatherCode: 1,
    label: weatherLabel(1),
    humidity: 62,
    windSpeed: 14,
    daily,
    source: "mock",
  };
}

/**
 * Open-Meteo anahtar gerektirmez, bu yüzden gerçek veriyi varsayılan olarak
 * ondan çekiyoruz. Sadece ağ/istek hatası durumunda mock veriye düşer.
 */
export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toFixed(4));
    url.searchParams.set("longitude", lon.toFixed(4));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "6");

    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`weather upstream ${response.status}`);
    const data = await response.json();

    const daily: DailyForecast[] = (data.daily.time as string[])
      .slice(1)
      .map((date: string, i: number) => ({
        date,
        weatherCode: data.daily.weather_code[i + 1],
        label: weatherLabel(data.daily.weather_code[i + 1]),
        tempMax: Math.round(data.daily.temperature_2m_max[i + 1]),
        tempMin: Math.round(data.daily.temperature_2m_min[i + 1]),
      }));

    return {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      label: weatherLabel(data.current.weather_code),
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: Math.round(data.current.wind_speed_10m),
      daily,
      source: "live",
    };
  } catch {
    return buildMockWeather();
  }
}

/** Yüksek nem/yağış kodlarında haşere riski notu üretir; aksi halde null. */
export function pestRiskNote(weather: WeatherData): string | null {
  const rainyCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]);
  if (weather.humidity >= 70) {
    return "Yüksek nem nedeniyle hamamböceği aktivitesi artabilir.";
  }
  if (rainyCodes.has(weather.weatherCode)) {
    return "Yağış nedeniyle kemirgenlerin kapalı alanlara yönelme riski artabilir.";
  }
  if (weather.temperature >= 28) {
    return "Yüksek sıcaklık nedeniyle uçan haşere aktivitesi artabilir.";
  }
  return null;
}
