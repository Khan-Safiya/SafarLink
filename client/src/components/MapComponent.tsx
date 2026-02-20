import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '400px'
};

// Default to New Delhi
const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

interface MapComponentProps {
    isLoaded: boolean;
    directions?: google.maps.DirectionsResult | null;
    simulationLocation?: google.maps.LatLngLiteral | null;
    currentStepType?: string;
}

function MapComponent({ isLoaded, directions, simulationLocation, currentStepType }: MapComponentProps) {
    // User's real-time location
    const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    // Default to New Delhi if user location not found
    const center = userLocation || defaultCenter;

    // Get Real-time location
    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(pos);
                    // Optional: Pan map to user on first load
                    // if (map) map.panTo(pos); 
                },
                (error) => {
                    console.error("Error watching geolocation:", error);
                }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [map]);

    const { socket } = useSocket();
    const [riders, setRiders] = useState<{ [key: string]: { lat: number, lng: number } }>({});

    useEffect(() => {
        if (!socket) return;

        socket.on('location_update', (data: { rideId: string, lat: number, lng: number, userId?: string }) => {
            // In a real app, filtering by rideId is crucial.
            // For this demo, we can just show all updates or use a dummy ID.
            console.log("Location received:", data);
            setRiders(prev => ({
                ...prev,
                [data.rideId]: { lat: data.lat, lng: data.lng }
            }));
        });

        return () => {
            socket.off('location_update');
        };
    }, [socket]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
        >
            {/* User's Current Location Marker */}
            {userLocation && (
                <Marker
                    position={userLocation}
                    title="You are here"
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    }}
                />
            )}

            {/* Simulation Location Marker (Changes icon based on transport mode) */}
            {simulationLocation && (
                <Marker
                    position={simulationLocation}
                    zIndex={50}
                    icon={{
                        url: currentStepType === 'walk' ? 'https://maps.google.com/mapfiles/kml/shapes/man.png' :
                            currentStepType === 'metro' || currentStepType === 'train' ? 'https://maps.google.com/mapfiles/kml/shapes/rail.png' :
                                currentStepType === 'bus' ? 'https://maps.google.com/mapfiles/kml/shapes/bus.png' :
                                    'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
                        scaledSize: new window.google.maps.Size(40, 40)
                    }}
                />
            )}

            {/* Draw the Routes with Colors */}
            {directions && directions.routes.map((_route, index) => {
                // Determine color based on index/type
                // 0: Fastest (Blue)
                // 1: Cheapest (Green)
                // 2: Safest (Red)
                let color = "#2563EB"; // Blue default
                let zIndex = 1;

                if (index === 0) { color = "#2563EB"; zIndex = 10; } // Fastest
                else if (index === 1) { color = "#16A34A"; zIndex = 5; } // Cheapest (Green)
                else if (index === 2) { color = "#DC2626"; zIndex = 4; } // Safest (Red)

                return (
                    <DirectionsRenderer
                        key={index}
                        directions={directions}
                        routeIndex={index}
                        options={{
                            suppressMarkers: index !== 0, // Only show markers for the primary route
                            polylineOptions: {
                                strokeColor: color,
                                strokeWeight: 6,
                                strokeOpacity: 0.8,
                                zIndex: zIndex
                            }
                        }}
                    />
                );
            })}

            {/* Render markers for other riders/drivers */}
            {Object.entries(riders).map(([id, loc]) => (
                <Marker
                    key={id}
                    position={loc}
                    icon={{
                        url: "https://maps.google.com/mapfiles/kml/shapes/cabs.png",
                        scaledSize: new window.google.maps.Size(30, 30)
                    }}
                />
            ))}
        </GoogleMap>
    );
}

export default memo(MapComponent);
