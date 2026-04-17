import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherWidgetProps {
  location: string;
}

export function WeatherWidget({ location }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using OpenWeather API (free tier)
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)},IN&appid=YOUR_OPENWEATHER_API_KEY&units=metric`
        );

        if (!response.ok) throw new Error("Weather fetch failed");

        const data = await response.json();

        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: getWeatherIcon(data.weather[0].main),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed)
        });
      } catch (err) {
        // Fallback weather data for demo
        setWeather({
          temp: 28,
          condition: "Sunny",
          icon: "sun",
          humidity: 65,
          windSpeed: 12
        });
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  const getWeatherIcon = (condition: string): string => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes("clear") || conditionLower.includes("sun")) return "sun";
    if (conditionLower.includes("cloud")) return "cloud";
    if (conditionLower.includes("rain")) return "cloud-rain";
    if (conditionLower.includes("thunder")) return "bolt";
    if (conditionLower.includes("snow")) return "snowflake";
    if (conditionLower.includes("mist") || conditionLower.includes("fog")) return "smog";
    return "sun";
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-amber-200/50 animate-pulse">
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-amber-200/50"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Weather in {location}</p>
          <div className="flex items-center gap-3">
            <i className={`fas fa-${weather.icon} text-3xl text-primary`}></i>
            <div>
              <p className="text-2xl font-bold">{weather.temp}°C</p>
              <p className="text-sm text-gray-600">{weather.condition}</p>
            </div>
          </div>
        </div>

        <div className="text-right text-sm text-gray-600 space-y-1">
          <div>
            <i className="fas fa-droplet mr-1"></i>
            {weather.humidity}%
          </div>
          <div>
            <i className="fas fa-wind mr-1"></i>
            {weather.windSpeed} km/h
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-gray-400 mt-2">*Sample weather data</p>
      )}
    </motion.div>
  );
}
