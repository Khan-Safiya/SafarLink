"""
Monsoon-Adaptive Weather Agent
Fetches real-time weather from Open-Meteo (free, no API key needed) for Pune.
Returns rain probability, intensity, and route advisories.
"""
import os
import math
from typing import Optional
import urllib.request
import json
from pydantic import BaseModel

# Pune city centre coordinates (lat/lng)
PUNE_LAT = 18.5204
PUNE_LNG = 73.8567

# WMO Weather Interpretation Codes for rain/thunderstorm
RAIN_CODES = {
    51, 53, 55,          # Drizzle
    61, 63, 65,          # Rain
    80, 81, 82,          # Rain showers
    95, 96, 99,          # Thunderstorm
}

HEAVY_RAIN_CODES = {65, 82, 95, 96, 99}

WMO_LABELS = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Heavy drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Heavy thunderstorm with hail",
}


class WeatherData(BaseModel):
    temperature_c: float
    rain_probability_pct: float       # 0-100
    precipitation_mm: float           # mm in the current hour
    weather_code: int
    weather_description: str
    is_raining: bool
    is_heavy_rain: bool
    monsoon_advisory: Optional[str]   # Human-readable advisory for routing


def get_pune_weather() -> WeatherData:
    """
    Fetch current weather for Pune from Open-Meteo (free, no key needed).
    Falls back to a safe no-rain default on any error.
    """
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={PUNE_LAT}&longitude={PUNE_LNG}"
            f"&current=temperature_2m,precipitation,weathercode,precipitation_probability"
            f"&timezone=Asia%2FKolkata"
            f"&forecast_days=1"
        )
        with urllib.request.urlopen(url, timeout=4) as resp:
            data = json.load(resp)

        current = data.get("current", {})
        code = int(current.get("weathercode", 0))
        temp = float(current.get("temperature_2m", 30.0))
        precip = float(current.get("precipitation", 0.0))
        rain_prob = float(current.get("precipitation_probability", 0.0))

        is_raining = code in RAIN_CODES or precip > 0.5
        is_heavy = code in HEAVY_RAIN_CODES or precip > 5.0

        advisory = None
        if is_heavy:
            advisory = (
                "⛈️ Heavy rain in Pune. Waterlogging likely near Swargate, "
                "Kothrud, and low-lying underpasses. Rerouting via elevated/sheltered paths (+3–5 mins). "
                "Prefer metro over bus connections where possible."
            )
        elif is_raining:
            advisory = (
                "🌧️ Light rain in Pune. Some footpaths near transit stations may be wet. "
                "Adding sheltered walking segments to your route (+1–2 mins)."
            )

        return WeatherData(
            temperature_c=temp,
            rain_probability_pct=rain_prob,
            precipitation_mm=precip,
            weather_code=code,
            weather_description=WMO_LABELS.get(code, f"Code {code}"),
            is_raining=is_raining,
            is_heavy_rain=is_heavy,
            monsoon_advisory=advisory,
        )
    except Exception:
        # Safe fallback — assume dry conditions
        return WeatherData(
            temperature_c=30.0,
            rain_probability_pct=0.0,
            precipitation_mm=0.0,
            weather_code=0,
            weather_description="Clear sky",
            is_raining=False,
            is_heavy_rain=False,
            monsoon_advisory=None,
        )
