import { useState, useEffect } from "react";

const CHATBOT_BASE = "http://localhost:8000";

export interface WeatherData {
    temperature_c: number;
    rain_probability_pct: number;
    precipitation_mm: number;
    weather_code: number;
    weather_description: string;
    is_raining: boolean;
    is_heavy_rain: boolean;
    monsoon_advisory: string | null;
}

const FALLBACK: WeatherData = {
    temperature_c: 30,
    rain_probability_pct: 0,
    precipitation_mm: 0,
    weather_code: 0,
    weather_description: "Clear",
    is_raining: false,
    is_heavy_rain: false,
    monsoon_advisory: null,
};

export function useWeather(enabled = true) {
    const [weather, setWeather] = useState<WeatherData>(FALLBACK);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setLoading(true);
        fetch(`${CHATBOT_BASE}/weather`)
            .then((r) => r.json())
            .then((d) => { if (!cancelled) { setWeather(d); setLoading(false); } })
            .catch(() => { if (!cancelled) { setWeather(FALLBACK); setLoading(false); setError("Weather unavailable"); } });
        return () => { cancelled = true; };
    }, [enabled]);

    return { weather, loading, error };
}
