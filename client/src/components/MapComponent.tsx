import { GoogleMap, Marker, DirectionsRenderer, Circle, OverlayView } from '@react-google-maps/api';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import type { Incident } from './IncidentReporter';

const containerStyle = { width: '100%', height: '100%', minHeight: '400px' };
const defaultCenter = { lat: 18.5204, lng: 73.8567 }; // Pune

const INCIDENT_EMOJI: Record<string, string> = {
    road_blocked: '🚧', accident: '💥', waterlogging: '🌊',
    police_naka: '🚔', oil_spill: '🛢️', other: '⚠️',
};

interface MapComponentProps {
    isLoaded: boolean;
    directions?: google.maps.DirectionsResult | null;
    simulationLocation?: google.maps.LatLngLiteral | null;
    currentStepType?: string;
    /** Active incidents to display as danger-zone circles on the map */
    incidents?: Incident[];
}

function MapComponent({ isLoaded, directions, simulationLocation, currentStepType, incidents = [] }: MapComponentProps) {
    const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) return;
        const id = navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn("Geolocation error:", err)
        );
        return () => navigator.geolocation.clearWatch(id);
    }, []);

    // Pan to user location on first fix
    useEffect(() => {
        if (map && userLocation) map.panTo(userLocation);
    }, [map, userLocation]);

    const { socket } = useSocket();
    const [riders, setRiders] = useState<{ [key: string]: { lat: number; lng: number } }>({});

    useEffect(() => {
        if (!socket) return;
        const handler = (data: { rideId: string; lat: number; lng: number }) => {
            setRiders(prev => ({ ...prev, [data.rideId]: { lat: data.lat, lng: data.lng } }));
        };
        socket.on('location_update', handler);
        return () => { socket.off('location_update', handler); };
    }, [socket]);

    const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
    const onUnmount = useCallback(() => setMap(null), []);

    if (!isLoaded) return <div className="flex items-center justify-center h-full text-gray-400">Loading Map…</div>;

    // Drive map center: prefer user GPS → then first incident → then directions start → default
    const center = userLocation
        ?? (incidents[0] ? { lat: incidents[0].lat, lng: incidents[0].lng } : null)
        ?? defaultCenter;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
        >
            {/* ── User GPS dot ─────────────────────────────────────────────── */}
            {userLocation && (
                <Marker
                    position={userLocation}
                    title="You are here"
                    zIndex={100}
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

            {/* ── Simulation / transport-mode marker ───────────────────────── */}
            {simulationLocation && (
                <Marker
                    position={simulationLocation}
                    zIndex={50}
                    icon={{
                        url: currentStepType === 'walk'
                            ? 'https://maps.google.com/mapfiles/kml/shapes/man.png'
                            : currentStepType === 'metro' || currentStepType === 'train'
                                ? 'https://maps.google.com/mapfiles/kml/shapes/rail.png'
                                : currentStepType === 'bus'
                                    ? 'https://maps.google.com/mapfiles/kml/shapes/bus.png'
                                    : 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                    }}
                />
            )}

            {/* ── Route polylines ───────────────────────────────────────────── */}
            {directions && directions.routes.map((_r, idx) => (
                <DirectionsRenderer
                    key={idx}
                    directions={directions}
                    routeIndex={idx}
                    options={{
                        suppressMarkers: idx !== 0,
                        polylineOptions: {
                            strokeColor: idx === 0 ? "#635BFF" : idx === 1 ? "#00D4FF" : "#2563EB",
                            strokeWeight: idx === 0 ? 7 : 4,
                            strokeOpacity: idx === 0 ? 0.9 : 0.5,
                            zIndex: idx === 0 ? 10 : 3,
                        },
                    }}
                />
            ))}

            {/* ── Danger zone overlays for each active incident ──────────────
                 Rendered as:
                 1. Pulsing red filled Circle  (200m radius = visible danger area)
                 2. Dashed outer warning ring  (400m = awareness zone)
                 3. Emoji + label via OverlayView
             */}
            {incidents.map((inc) => {
                const pos = { lat: inc.lat, lng: inc.lng };
                const emoji = INCIDENT_EMOJI[inc.type] ?? '⚠️';
                return (
                    <div key={inc.id}>
                        {/* Inner danger fill */}
                        <Circle
                            center={pos}
                            radius={200}
                            options={{
                                fillColor: '#EF4444',
                                fillOpacity: 0.25,
                                strokeColor: '#EF4444',
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                zIndex: 20,
                            }}
                        />
                        {/* Outer awareness ring */}
                        <Circle
                            center={pos}
                            radius={400}
                            options={{
                                fillColor: '#F97316',
                                fillOpacity: 0.08,
                                strokeColor: '#F97316',
                                strokeOpacity: 0.4,
                                strokeWeight: 1.5,
                                zIndex: 19,
                            }}
                        />
                        {/* Emoji pin label */}
                        <OverlayView
                            position={pos}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div
                                style={{
                                    transform: 'translate(-50%, -100%)',
                                    marginTop: '-8px',
                                    background: 'rgba(239,68,68,0.95)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    border: '2px solid white',
                                    userSelect: 'none',
                                }}
                            >
                                {emoji} {inc.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </div>
                        </OverlayView>
                    </div>
                );
            })}

            {/* ── Other riders ─────────────────────────────────────────────── */}
            {Object.entries(riders).map(([id, loc]) => (
                <Marker
                    key={id}
                    position={loc}
                    icon={{
                        url: "https://maps.google.com/mapfiles/kml/shapes/cabs.png",
                        scaledSize: new window.google.maps.Size(30, 30),
                    }}
                />
            ))}
        </GoogleMap>
    );
}

export default memo(MapComponent);
