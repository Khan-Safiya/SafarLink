import os
from typing import Optional

import googlemaps
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq

load_dotenv()

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

_llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"), temperature=0)

TRANSIT_FARE_TABLE = {
    "bus":     {"base": 10, "per_km": 0.8},
    "subway":  {"base": 10, "per_km": 1.5},  # Metro
    "driving": {"base": 15, "per_km": 8.3},  # Auto / Cab
}

TRANSIT_MODES = [
    ("transit", "bus",    "Bus"),           # PMPML + city buses (priority)
    ("transit", "subway", "Metro / Subway"), # Pune Metro (priority)
    ("driving", None,     "Auto / Cab"),    # Auto-rickshaw / cab
]


class FareRoute(BaseModel):
    mode: str = Field(description="Transit mode e.g. Bus, Metro / Subway, Auto / Cab")
    route_number: int = Field(description="Route alternative index")
    distance_km: float = Field(description="Total distance in kilometres")
    duration_minutes: int = Field(description="Total duration in minutes")
    estimated_fare_inr: float = Field(description="Estimated fare in INR")
    actual_fare: Optional[str] = Field(default=None, description="Actual fare string from API if available")
    origin: str
    destination: str
    fare_source: str = Field(description="'api' if real fare returned, 'estimated' if calculated")


class FareComparisonOutput(BaseModel):
    origin: str
    destination: str
    ranked_by_cost: list[FareRoute] = Field(description="All routes sorted cheapest first")
    ranked_by_speed: list[FareRoute] = Field(description="All routes sorted fastest first")
    cheapest: FareRoute = Field(description="Single cheapest option")
    fastest: FareRoute = Field(description="Single fastest option")
    best_value: FareRoute = Field(description="Best balance of cost and speed (lowest cost-per-minute)")


class _LocationExtract(BaseModel):
    origin: str
    destination: str


_extractor = _llm.with_structured_output(_LocationExtract)


def _estimate_fare(mode_key: str, dist_km: float, api_fare: Optional[dict]) -> tuple[float, str]:
    if api_fare and "value" in api_fare:
        return float(api_fare["value"]), "api"
    table = TRANSIT_FARE_TABLE.get(mode_key, {"base": 10, "per_km": 1.0})
    return round(table["base"] + dist_km * table["per_km"], 2), "estimated"


def _fetch_fare_routes(origin: str, destination: str) -> list[FareRoute]:
    all_routes: list[FareRoute] = []
    for maps_mode, transit_mode, label in TRANSIT_MODES:
        try:
            kwargs: dict = {"origin": origin, "destination": destination, "mode": maps_mode, "alternatives": True}
            if transit_mode:
                kwargs["transit_mode"] = transit_mode
            directions = gmaps.directions(**kwargs)
        except Exception:
            continue
        for i, route in enumerate(directions, 1):
            leg = route["legs"][0]
            dist_km  = leg["distance"]["value"] / 1000
            dur_mins = leg["duration"]["value"] // 60
            mode_key = transit_mode or maps_mode
            api_fare = route.get("fare")
            fare_val, fare_src = _estimate_fare(mode_key, dist_km, api_fare)
            all_routes.append(FareRoute(
                mode=label,
                route_number=i,
                distance_km=round(dist_km, 2),
                duration_minutes=dur_mins,
                estimated_fare_inr=fare_val,
                actual_fare=api_fare.get("text") if api_fare else None,
                origin=leg["start_address"],
                destination=leg["end_address"],
                fare_source=fare_src,
            ))
    return all_routes


def run_fare_agent(query: str) -> FareComparisonOutput:
    locs = _extractor.invoke(f"Extract the origin and destination from this travel query: {query}")
    routes = _fetch_fare_routes(locs.origin, locs.destination)
    if not routes:
        empty = FareRoute(mode="N/A", route_number=0, distance_km=0, duration_minutes=0,
                          estimated_fare_inr=0, origin=locs.origin, destination=locs.destination, fare_source="none")
        return FareComparisonOutput(origin=locs.origin, destination=locs.destination,
                                    ranked_by_cost=[empty], ranked_by_speed=[empty],
                                    cheapest=empty, fastest=empty, best_value=empty)
    by_cost  = sorted(routes, key=lambda r: r.estimated_fare_inr)
    by_speed = sorted(routes, key=lambda r: r.duration_minutes)
    by_value = sorted(routes, key=lambda r: r.estimated_fare_inr / max(r.duration_minutes, 1))
    return FareComparisonOutput(
        origin=locs.origin,
        destination=locs.destination,
        ranked_by_cost=by_cost,
        ranked_by_speed=by_speed,
        cheapest=by_cost[0],
        fastest=by_speed[0],
        best_value=by_value[0],
    )
