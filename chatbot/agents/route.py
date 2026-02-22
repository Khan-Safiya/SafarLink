import os
import re
from typing import Optional

import googlemaps
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from .weather import get_pune_weather, WeatherData

load_dotenv()

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

# _llm = ChatGoogleGenerativeAI(
#     model="gemini-1.5-pro",
#     temperature=0,
#     google_api_key=os.getenv("GOOGLE_API_KEY"),
# )


_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text).strip()


class TransitInfo(BaseModel):
    vehicle_type: str = Field(description="Type of vehicle: bus, subway, train, tram, etc.")
    line_name: str = Field(description="Name or number of the transit line/service")
    departure_stop: str = Field(description="Boarding stop name")
    arrival_stop: str = Field(description="Alighting stop name")
    num_stops: int = Field(description="Number of stops on this leg")


class RouteStep(BaseModel):
    step_number: int = Field(description="Step index starting from 1")
    instruction: str = Field(description="Plain-text navigation instruction for this step")
    distance: str = Field(description="Distance covered in this step e.g. '1.2 km'")
    duration: str = Field(description="Time for this step e.g. '5 mins'")
    travel_mode: str = Field(description="Mode for this step: WALKING, TRANSIT, DRIVING")
    transit_info: Optional[TransitInfo] = Field(default=None, description="Transit details if this step uses transit")


class DetailedRoute(BaseModel):
    route_number: int = Field(description="Route index starting from 1")
    total_distance: str = Field(description="Total distance for the entire route")
    total_duration: str = Field(description="Total travel time for the entire route")
    origin: str = Field(description="Full origin address from the API")
    destination: str = Field(description="Full destination address from the API")
    steps: list[RouteStep] = Field(description="All steps from start to end in order")


class TransitModeRoutes(BaseModel):
    mode: str = Field(description="Transit mode label e.g. Bus, Train, Metro/Subway, Tram, Driving")
    available: bool = Field(description="True if at least one route exists for this mode")
    routes: list[DetailedRoute] = Field(description="All route options for this mode")


class RouteAgentOutput(BaseModel):
    origin: str = Field(description="Origin location from the query")
    destination: str = Field(description="Destination location from the query")
    transit_options: list[TransitModeRoutes] = Field(description="Routes grouped by transit mode")
    weather_advisory: Optional[str] = Field(default=None, description="Monsoon/rain advisory for routing, if applicable")
    is_raining: bool = Field(default=False, description="True if it is currently raining in Pune")
    rain_probability_pct: float = Field(default=0.0, description="Current rain probability percentage")
    weather_description: str = Field(default="Clear", description="Human-readable weather description")


_TRANSIT_MODES = [
    ("transit", "bus",    "Bus"),          # PMPML + city buses (priority)
    ("transit", "subway", "Metro / Subway"),  # Pune Metro (priority)
    ("driving", None,     "Auto / Cab"),   # Auto-rickshaw / cab
]



class _LocationExtract(BaseModel):
    origin: str
    destination: str


_location_extractor = _llm.with_structured_output(_LocationExtract)


def _build_steps(leg: dict, mode: str, weather: Optional[WeatherData] = None) -> list[RouteStep]:
    steps = []
    for j, step in enumerate(leg["steps"], 1):
        transit_info = None
        if "transit_details" in step:
            t = step["transit_details"]
            line = t.get("line", {})
            transit_info = TransitInfo(
                vehicle_type=line.get("vehicle", {}).get("type", "transit"),
                line_name=line.get("name", line.get("short_name", "")),
                departure_stop=t["departure_stop"]["name"],
                arrival_stop=t["arrival_stop"]["name"],
                num_stops=t.get("num_stops", 0),
            )
        instruction = _strip_html(step.get("html_instructions", ""))
        # Annotate walking steps with rain warning when it's raining
        step_mode = step.get("travel_mode", mode.upper())
        if weather and weather.is_raining and step_mode == "WALKING":
            dist_m = step.get("distance", {}).get("value", 0)
            if dist_m > 100:  # Only warn for walks longer than 100m
                rain_tag = "☔ Rain: exposed walk" if not weather.is_heavy_rain else "⛈️ Heavy rain: seek shelter"
                instruction = f"{instruction} [{rain_tag}]"
        steps.append(RouteStep(
            step_number=j,
            instruction=instruction,
            distance=step["distance"]["text"],
            duration=step["duration"]["text"],
            travel_mode=step_mode,
            transit_info=transit_info,
        ))
    return steps


def _fetch_detailed_routes(origin: str, destination: str, mode: str, transit_mode: Optional[str], weather: Optional[WeatherData] = None) -> list[DetailedRoute]:
    try:
        kwargs: dict = {
            "origin": origin,
            "destination": destination,
            "mode": mode,
            "alternatives": True,
        }
        if transit_mode:
            kwargs["transit_mode"] = transit_mode
        directions = gmaps.directions(**kwargs)
    except Exception:
        return []

    routes = []
    for i, route in enumerate(directions, 1):
        leg = route["legs"][0]
        routes.append(DetailedRoute(
            route_number=i,
            total_distance=leg["distance"]["text"],
            total_duration=leg["duration"]["text"],
            origin=leg["start_address"],
            destination=leg["end_address"],
            steps=_build_steps(leg, mode, weather),
        ))
    return routes


def run_route_agent(query: str) -> RouteAgentOutput:
    locs = _location_extractor.invoke(
        f"Extract the origin and destination from this travel query: {query}"
    )

    # ── Fetch real-time Pune weather ─────────────────────────────────────────
    weather = get_pune_weather()

    # If heavy rain, prioritise Metro (sheltered) over Bus (exposed stops)
    transit_modes = list(_TRANSIT_MODES)
    if weather.is_heavy_rain:
        # Move Metro to first position so it becomes the default suggestion
        transit_modes = [
            ("transit", "subway", "Metro / Subway 🌂"),  # sheltered — priority
            ("transit", "bus",    "Bus"),
            ("driving", None,     "Auto / Cab"),
        ]

    transit_options = []
    for maps_mode, transit_mode, label in transit_modes:
        routes = _fetch_detailed_routes(locs.origin, locs.destination, maps_mode, transit_mode, weather)
        transit_options.append(TransitModeRoutes(
            mode=label,
            available=len(routes) > 0,
            routes=routes,
        ))
    return RouteAgentOutput(
        origin=locs.origin,
        destination=locs.destination,
        transit_options=transit_options,
        weather_advisory=weather.monsoon_advisory,
        is_raining=weather.is_raining,
        rain_probability_pct=weather.rain_probability_pct,
        weather_description=weather.weather_description,
    )
