// Basic Haversine distance
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

// Check deviation from a polyline (simplified as sequence of points)
// For this demo, we'll just check distance from a single "target" or simplified route
export const isDeviated = (currentLat: number, currentLng: number, routePoints: {lat: number, lng: number}[], thresholdMeters: number = 100) => {
    // Determine the minimum distance to any point on the route
    // In a real app, uses cross-track distance to segments
    let minDistance = Infinity;
    
    for(const point of routePoints) {
        const d = getDistance(currentLat, currentLng, point.lat, point.lng);
        if (d < minDistance) minDistance = d;
    }

    return minDistance > thresholdMeters;
};
