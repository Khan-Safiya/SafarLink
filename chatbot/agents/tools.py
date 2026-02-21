import os
import googlemaps
from dotenv import load_dotenv
from langchain.tools import tool

load_dotenv()

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))


@tool
def get_routes(origin: str, destination: str, mode: str = "transit", transit_mode: str = "bus") -> str:
    """Get route options between two places. mode: driving, walking, bicycling, transit. transit_mode (when mode=transit): bus, subway, train, tram, rail."""
    try:
        directions = gmaps.directions(
            origin=origin, destination=destination, mode=mode,
            transit_mode=transit_mode if mode == "transit" else None,
            alternatives=True,
        )
        if not directions:
            return f"No routes found from '{origin}' to '{destination}'"
        out = []
        for i, route in enumerate(directions, 1):
            leg = route["legs"][0]
            fare_text = ""
            if "fare" in route:
                fare_text = f" | Fare: {route['fare'].get('text', '')}"
            out.append(f"Route {i}: {leg['distance']['text']} ({leg['duration']['text']}){fare_text}")
            out.append(f"  {leg['start_address']} → {leg['end_address']}")
        return "\n".join(out)
    except Exception as e:
        return f"Error: {e}"


@tool
def get_distance_matrix(origins: str, destinations: str, mode: str = "driving") -> str:
    """Distance and time matrix between origins and destinations. Separate multiple with '|'. mode: driving, walking, bicycling, transit."""
    try:
        matrix = gmaps.distance_matrix(origins=origins.split("|"), destinations=destinations.split("|"), mode=mode)
        results = []
        for i, row in enumerate(matrix["rows"]):
            origin = matrix["origin_addresses"][i]
            for j, element in enumerate(row["elements"]):
                dest = matrix["destination_addresses"][j]
                if element["status"] == "OK":
                    results.append(f"{origin} → {dest}: {element['distance']['text']} in {element['duration']['text']}")
                else:
                    results.append(f"{origin} → {dest}: No route found")
        return "\n".join(results)
    except Exception as e:
        return f"Error: {e}"


@tool
def search_places(query: str, location: str = "", radius: int = 5000) -> str:
    """Search for places (restaurants, hotels, landmarks, hospitals, etc). Optional location (address or lat,lng) and radius in metres."""
    try:
        kwargs: dict = {"query": query}
        if location:
            geo = gmaps.geocode(location)
            if geo:
                loc = geo[0]["geometry"]["location"]
                kwargs["location"] = (loc["lat"], loc["lng"])
                kwargs["radius"] = radius
        results = gmaps.places(**kwargs).get("results", [])
        if not results:
            return "No places found."
        return "\n".join(
            f"- {p['name']} | ⭐ {p.get('rating', 'N/A')} | {p.get('formatted_address', p.get('vicinity', ''))}"
            for p in results[:6]
        )
    except Exception as e:
        return f"Error: {e}"


@tool
def geocode_address(address: str) -> str:
    """Convert a human-readable address into latitude and longitude coordinates."""
    try:
        results = gmaps.geocode(address)
        if not results:
            return f"Could not geocode '{address}'"
        loc = results[0]["geometry"]["location"]
        return f"{results[0]['formatted_address']} → lat: {loc['lat']}, lng: {loc['lng']}"
    except Exception as e:
        return f"Error: {e}"


@tool
def reverse_geocode(lat: float, lng: float) -> str:
    """Convert latitude and longitude coordinates into a human-readable address."""
    try:
        results = gmaps.reverse_geocode((lat, lng))
        if not results:
            return "No address found for these coordinates."
        return results[0]["formatted_address"]
    except Exception as e:
        return f"Error: {e}"


@tool
def get_place_details(place_name: str, location: str = "") -> str:
    """Get detailed information about a specific place: address, phone, website, hours, rating, reviews."""
    try:
        search_kwargs: dict = {"query": place_name}
        if location:
            geo = gmaps.geocode(location)
            if geo:
                loc = geo[0]["geometry"]["location"]
                search_kwargs["location"] = (loc["lat"], loc["lng"])
                search_kwargs["radius"] = 5000
        results = gmaps.places(**search_kwargs).get("results", [])
        if not results:
            return f"Place '{place_name}' not found."
        place_id = results[0]["place_id"]
        details = gmaps.place(place_id, fields=[
            "name", "formatted_address", "formatted_phone_number",
            "website", "rating", "opening_hours", "reviews", "price_level"
        ])["result"]
        lines = [f"Name: {details.get('name', '')}",
                 f"Address: {details.get('formatted_address', '')}",
                 f"Phone: {details.get('formatted_phone_number', 'N/A')}",
                 f"Website: {details.get('website', 'N/A')}",
                 f"Rating: {details.get('rating', 'N/A')} / 5",
                 f"Price Level: {'$' * details.get('price_level', 0) or 'N/A'}"]
        if "opening_hours" in details:
            status = "Open now" if details["opening_hours"].get("open_now") else "Closed now"
            lines.append(f"Status: {status}")
            lines.extend(details["opening_hours"].get("weekday_text", []))
        return "\n".join(lines)
    except Exception as e:
        return f"Error: {e}"


@tool
def find_nearby_places(location: str, place_type: str, radius: int = 2000, max_results: int = 5) -> str:
    """Find nearby places of a specific type near a location. Types: restaurant, hospital, gas_station, atm, pharmacy, hotel, transit_station, cafe, supermarket, etc."""
    try:
        geo = gmaps.geocode(location)
        if not geo:
            return f"Could not find location: {location}"
        loc = geo[0]["geometry"]["location"]
        results = gmaps.places_nearby(
            location=(loc["lat"], loc["lng"]),
            radius=radius,
            type=place_type.lower().replace(" ", "_"),
        ).get("results", [])
        if not results:
            return f"No {place_type} found near {location}"
        return "\n".join(
            f"{i}. {p['name']} | ⭐ {p.get('rating', 'N/A')} | {p.get('vicinity', '')} | "
            f"{'Open' if p.get('opening_hours', {}).get('open_now') else 'Status unknown'}"
            for i, p in enumerate(results[:max_results], 1)
        )
    except Exception as e:
        return f"Error: {e}"


@tool
def get_route_with_waypoints(origin: str, destination: str, waypoints: str, mode: str = "driving") -> str:
    """Get a route summary with intermediate stops. Separate waypoints with '|'. For full step-by-step directions use get_waypoint_route_steps instead."""
    try:
        directions = gmaps.directions(
            origin=origin, destination=destination,
            waypoints=waypoints.split("|"), mode=mode, optimize_waypoints=True,
        )
        if not directions:
            return "No route found with these waypoints."
        out = []
        for route in directions:
            total_dist = sum(leg["distance"]["value"] for leg in route["legs"])
            total_dur  = sum(leg["duration"]["value"] for leg in route["legs"])
            out.append(f"Total: {total_dist / 1000:.1f} km ({total_dur // 3600}h {(total_dur % 3600) // 60}m)")
            for i, leg in enumerate(route["legs"]):
                out.append(f"  Leg {i+1}: {leg['start_address'].split(',')[0]} → {leg['end_address'].split(',')[0]} | {leg['distance']['text']} ({leg['duration']['text']})")
        return "\n".join(out)
    except Exception as e:
        return f"Error: {e}"


@tool
def get_timezone_info(location: str) -> str:
    """Get the timezone for a given location or address."""
    import time
    try:
        geo = gmaps.geocode(location)
        if not geo:
            return f"Could not find location: {location}"
        loc = geo[0]["geometry"]["location"]
        tz = gmaps.timezone(location=(loc["lat"], loc["lng"]), timestamp=int(time.time()))
        offset_hrs = (tz["rawOffset"] + tz["dstOffset"]) / 3600
        sign = "+" if offset_hrs >= 0 else ""
        return f"{location} → {tz['timeZoneName']} (UTC{sign}{offset_hrs:.1f})"
    except Exception as e:
        return f"Error: {e}"


@tool
def get_elevation(location: str) -> str:
    """Get the elevation above sea level for a given location or address."""
    try:
        geo = gmaps.geocode(location)
        if not geo:
            return f"Could not find location: {location}"
        loc = geo[0]["geometry"]["location"]
        result = gmaps.elevation([(loc["lat"], loc["lng"])])[0]
        return f"{location}: {result['elevation']:.1f} metres above sea level"
    except Exception as e:
        return f"Error: {e}"


@tool
def estimate_travel_cost(origin: str, destination: str, mode: str = "driving", fuel_price_per_litre: float = 100.0, fuel_efficiency_kmpl: float = 12.0) -> str:
    """Estimate the travel cost for a journey. For driving: calculates fuel cost. For transit modes: uses typical Indian fare estimates. fuel_price_per_litre in INR (default 100). fuel_efficiency_kmpl in km/litre (default 12)."""
    TRANSIT_FARES = {
        "bus":    {"base": 10, "per_km": 0.8,  "label": "Bus (estimated)"},
        "subway": {"base": 10, "per_km": 1.5,  "label": "Metro (estimated)"},
        "train":  {"base": 15, "per_km": 0.5,  "label": "Train (estimated, sleeper class)"},
        "tram":   {"base": 5,  "per_km": 0.6,  "label": "Tram (estimated)"},
    }
    try:
        directions = gmaps.directions(origin=origin, destination=destination, mode=mode)
        if not directions:
            return "No route found."
        leg  = directions[0]["legs"][0]
        dist_km   = leg["distance"]["value"] / 1000
        duration  = leg["duration"]["text"]
        fare_info = directions[0].get("fare")
        if fare_info:
            return (f"Mode: {mode.title()} | Distance: {leg['distance']['text']} | Duration: {duration}\n"
                    f"Actual Fare: {fare_info.get('text', 'N/A')} ({fare_info.get('currency', '')})")
        if mode == "driving":
            cost = (dist_km / fuel_efficiency_kmpl) * fuel_price_per_litre
            return (f"Mode: Driving | Distance: {leg['distance']['text']} | Duration: {duration}\n"
                    f"Est. Fuel Cost: ₹{cost:.0f} (@ ₹{fuel_price_per_litre}/L, {fuel_efficiency_kmpl} km/L)")
        fare = TRANSIT_FARES.get(mode, {"base": 10, "per_km": 1.0, "label": mode.title()})
        cost = fare["base"] + dist_km * fare["per_km"]
        return (f"Mode: {fare['label']} | Distance: {leg['distance']['text']} | Duration: {duration}\n"
                f"Est. Fare: ₹{cost:.0f}")
    except Exception as e:
        return f"Error: {e}"


@tool
def get_detailed_route(origin: str, destination: str, mode: str = "driving", transit_mode: str = "bus") -> str:
    """
    Get FULL step-by-step directions between two places including every navigation instruction.
    Always use this when the user asks for route directions, steps, or how to get from A to B.
    mode: driving, walking, bicycling, transit.
    transit_mode (when mode=transit): bus, subway, train, tram, rail.
    """
    import re
    def strip_html(t): return re.sub(r"<[^>]+>", " ", t).strip()
    try:
        directions = gmaps.directions(
            origin=origin, destination=destination, mode=mode,
            transit_mode=transit_mode if mode == "transit" else None,
            alternatives=True,
        )
        if not directions:
            return f"No routes found from '{origin}' to '{destination}'"
        out = []
        for ri, route in enumerate(directions, 1):
            leg = route["legs"][0]
            fare_str = f" | Fare: {route['fare']['text']}" if "fare" in route else ""
            out.append(f"=== Route {ri}: {leg['distance']['text']} ({leg['duration']['text']}){fare_str} ===")
            out.append(f"From: {leg['start_address']}")
            out.append(f"To:   {leg['end_address']}")
            out.append("")
            for si, step in enumerate(leg["steps"], 1):
                instr = strip_html(step.get("html_instructions", ""))
                dist  = step["distance"]["text"]
                dur   = step["duration"]["text"]
                out.append(f"  Step {si}: {instr} [{dist} / {dur}]")
                if "transit_details" in step:
                    t    = step["transit_details"]
                    line = t.get("line", {})
                    veh  = line.get("vehicle", {}).get("type", "transit")
                    out.append(f"    → {veh.upper()}: {line.get('name', line.get('short_name', ''))}")
                    out.append(f"    → Board at: {t['departure_stop']['name']}")
                    out.append(f"    → Alight at: {t['arrival_stop']['name']} ({t.get('num_stops', 0)} stops)")
            out.append("")
        return "\n".join(out)
    except Exception as e:
        return f"Error: {e}"


@tool
def get_waypoint_route_steps(origin: str, destination: str, waypoints: str, mode: str = "driving") -> str:
    """
    Get FULL step-by-step directions for a trip with intermediate stops (waypoints).
    Always use this when the user wants to plan a multi-stop trip with actual navigation steps.
    Separate waypoints with '|'. e.g. waypoints='Mathura' for Delhi→Mathura→Agra.
    mode: driving, walking, bicycling, transit.
    """
    import re
    def strip_html(t): return re.sub(r"<[^>]+>", " ", t).strip()
    try:
        directions = gmaps.directions(
            origin=origin, destination=destination,
            waypoints=waypoints.split("|"), mode=mode, optimize_waypoints=True,
        )
        if not directions:
            return "No route found with these waypoints."
        out = []
        route = directions[0]
        total_dist = sum(l["distance"]["value"] for l in route["legs"])
        total_dur  = sum(l["duration"]["value"] for l in route["legs"])
        out.append(f"=== Multi-Stop Trip ===")
        out.append(f"Total: {total_dist/1000:.1f} km | {total_dur//3600}h {(total_dur%3600)//60}m")
        out.append(f"Stops: {origin} → {' → '.join(waypoints.split('|'))} → {destination}")
        out.append("")
        step_global = 1
        for li, leg in enumerate(route["legs"]):
            out.append(f"--- Leg {li+1}: {leg['start_address'].split(',')[0]} → {leg['end_address'].split(',')[0]} ({leg['distance']['text']} / {leg['duration']['text']}) ---")
            for step in leg["steps"]:
                instr = strip_html(step.get("html_instructions", ""))
                dist  = step["distance"]["text"]
                dur   = step["duration"]["text"]
                out.append(f"  Step {step_global}: {instr} [{dist} / {dur}]")
                if "transit_details" in step:
                    t    = step["transit_details"]
                    line = t.get("line", {})
                    veh  = line.get("vehicle", {}).get("type", "transit")
                    out.append(f"    → {veh.upper()}: {line.get('name', '')} | {t['departure_stop']['name']} → {t['arrival_stop']['name']}")
                step_global += 1
            out.append("")
        return "\n".join(out)
    except Exception as e:
        return f"Error: {e}"


ALL_TOOLS = [
    get_detailed_route,
    get_waypoint_route_steps,
    get_routes,
    get_distance_matrix,
    search_places,
    geocode_address,
    reverse_geocode,
    get_place_details,
    find_nearby_places,
    get_route_with_waypoints,
    get_timezone_info,
    get_elevation,
    estimate_travel_cost,
]
