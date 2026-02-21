import os
import googlemaps
from dotenv import load_dotenv
from langchain.tools import tool

load_dotenv()

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))


@tool
def get_routes(origin: str, destination: str, mode: str = "transit", transit_mode: str = "bus") -> str:
    """Get distance, duration, and route options between two places. Modes: driving, walking, bicycling, transit. Transit modes (when mode=transit): bus, subway, train, tram, rail."""
    try:
        directions = gmaps.directions(
            origin=origin,
            destination=destination,
            mode=mode,
            transit_mode=transit_mode if mode == "transit" else None,
            alternatives=True,
        )
        if not directions:
            return f"No routes found from '{origin}' to '{destination}'"
        output = []
        for i, route in enumerate(directions, 1):
            leg = route["legs"][0]
            transit_details = []
            for step in leg["steps"]:
                if "transit_details" in step:
                    t = step["transit_details"]
                    line = t.get("line", {})
                    vehicle = line.get("vehicle", {}).get("type", "transit")
                    transit_details.append(
                        f"Take {vehicle} {line.get('name', line.get('short_name', ''))} "
                        f"from {t['departure_stop']['name']} to {t['arrival_stop']['name']}"
                    )
            output.append(f"Route {i}: {leg['distance']['text']} ({leg['duration']['text']})")
            output.append(f"  From: {leg['start_address']}")
            output.append(f"  To:   {leg['end_address']}")
            if transit_details:
                output.append("  Transit steps:")
                for d in transit_details:
                    output.append(f"    - {d}")
            output.append("")
        return "\n".join(output)
    except Exception as e:
        return f"Error getting routes: {e}"


@tool
def get_distance_matrix(origins: str, destinations: str, mode: str = "driving") -> str:
    """Get travel distance and time between multiple origins and destinations. Separate multiple locations with a pipe '|'. Modes: driving, walking, bicycling, transit."""
    try:
        matrix = gmaps.distance_matrix(
            origins=origins.split("|"),
            destinations=destinations.split("|"),
            mode=mode,
        )
        results = []
        for i, row in enumerate(matrix["rows"]):
            origin = matrix["origin_addresses"][i]
            for j, element in enumerate(row["elements"]):
                dest = matrix["destination_addresses"][j]
                if element["status"] == "OK":
                    results.append(
                        f"{origin} -> {dest}: "
                        f"{element['distance']['text']} in {element['duration']['text']}"
                    )
                else:
                    results.append(f"{origin} -> {dest}: No route found")
        return "\n".join(results)
    except Exception as e:
        return f"Error calculating distances: {e}"


@tool
def search_places(query: str, location: str = "", radius: int = 5000) -> str:
    """Search for places like restaurants, hotels, or landmarks. Provide an optional location (address or lat,lng) and radius in metres."""
    try:
        kwargs: dict = {"query": query}
        if location:
            geo = gmaps.geocode(location)
            if geo:
                loc = geo[0]["geometry"]["location"]
                kwargs["location"] = (loc["lat"], loc["lng"])
                kwargs["radius"] = radius
        places = gmaps.places(**kwargs)
        results = places.get("results", [])
        if not results:
            return "No places found."
        lines = []
        for p in results[:5]:
            rating = p.get("rating", "N/A")
            address = p.get("formatted_address", p.get("vicinity", ""))
            lines.append(f"- {p['name']} | Rating: {rating} | {address}")
        return "\n".join(lines)
    except Exception as e:
        return f"Error searching places: {e}"
