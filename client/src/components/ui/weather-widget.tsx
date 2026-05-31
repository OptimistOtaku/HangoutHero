import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cloud, CloudDrizzle, CloudFog, CloudRain, CloudSnow, Sun, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "drizzle" | "rain" | "storm" | "snow" | "fog";
  humidity: number;
  windSpeed: number;
  locationName?: string;
}

interface WeatherWidgetProps {
  location: string;
}

export function WeatherWidget({ location }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchWeather = async () => {
      try {
        const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Weather fetch failed");
        }

        const data = await response.json();

        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather.condition,
          icon: data.weather.icon,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          locationName: data.locationName,
        });
        setError(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }

        setWeather(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    return () => controller.abort();
  }, [location]);

  const getWeatherIcon = (icon: WeatherData["icon"]) => {
    switch (icon) {
      case "cloud":
        return <Cloud className="h-8 w-8 text-secondary" />;
      case "drizzle":
        return <CloudDrizzle className="h-8 w-8 text-primary" />;
      case "rain":
      case "storm":
        return <CloudRain className="h-8 w-8 text-primary" />;
      case "snow":
        return <CloudSnow className="h-8 w-8 text-sky-600" />;
      case "fog":
        return <CloudFog className="h-8 w-8 text-slate-500" />;
      default:
        return <Sun className="h-8 w-8 text-accent" />;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border border-[rgba(244,208,63,0.4)] bg-white/80 p-5">
        <div className="h-16 rounded-2xl bg-slate-200"></div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-white/82 p-4 md:rounded-3xl md:p-5">
        <p className="text-sm font-semibold text-slate-500">Weather unavailable for {location}</p>
        {error && (
          <p className="mt-2 text-xs text-slate-400">Live weather could not be refreshed.</p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-[rgba(244,208,63,0.4)] bg-white/82 p-4 shadow-[0_14px_32px_rgba(255,56,92,0.05)] md:rounded-3xl md:p-5"
    >
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">
            Weather in {weather.locationName || location}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="shrink-0">{getWeatherIcon(weather.icon)}</div>
            <div>
              <p className="text-2xl font-extrabold text-[#111318]">{weather.temp}°C</p>
              <p className="text-sm text-slate-600">{weather.condition}</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 space-y-2 text-right text-xs text-slate-600 sm:text-sm">
          <div>{weather.humidity}% humidity</div>
          <div className="flex items-center justify-end gap-1">
            <Wind className="h-4 w-4" />
            {weather.windSpeed} km/h
          </div>
        </div>
      </div>
    </motion.div>
  );
}
