import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../components/Navbar";
import MapComponent from "../components/MapComponent";
import { useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X, AlertTriangle, RefreshCw, Navigation2, Star } from "lucide-react";
import SOSButton from "../components/SOSButton";
import ShareTrackingWidget from "../components/ShareTrackingWidget";
import SafetyMonitor from "../components/SafetyMonitor";
import JourneyChecklist from "../components/JourneyChecklist";
import IncidentReporter, { type Incident } from "../components/IncidentReporter";
import { useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import WeatherBanner from "../components/WeatherBanner";
import { useWeather } from "../hooks/useWeather";
import JourneyFeedbackModal from "../components/JourneyFeedbackModal";
import { useUser } from "@clerk/clerk-react";

const SERVER = "http://localhost:5000";
const libraries: ("places" | "geometry")[] = ["places", "geometry"];

function buildRouteId(a: string, b: string) {
    return `${a}||${b}`.toLowerCase().replace(/\s+/g, '-').slice(0, 80);
}

const INCIDENT_LABELS: Record<string, { label: string; emoji: string }> = {
    road_blocked: { label: "Road Blocked", emoji: "🚧" },
    accident: { label: "Accident", emoji: "💥" },
    waterlogging: { label: "Waterlogging", emoji: "🌊" },
    police_naka: { label: "Police Naka", emoji: "🚔" },
    oil_spill: { label: "Oil Spill", emoji: "🛢️" },
    other: { label: "Incident Ahead", emoji: "⚠️" },
}

// ── Haversine distance (km) between two lat/lng points ───────────────────────
function haversineKm(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Min distance (km) from a route's overview path to a given point
function minDistToPoint(route: google.maps.DirectionsRoute, pt: google.maps.LatLngLiteral): number {
    const path = route.overview_path;
    let min = Infinity;
    for (const p of path) {
        const d = haversineKm({ lat: p.lat(), lng: p.lng() }, pt);
        if (d < min) min = d;
    }
    return min;
}

// Pick the alternative route that stays furthest from all incident points
function pickSafestRoute(
    result: google.maps.DirectionsResult,
    incidents: Array<{ lat: number; lng: number }>
): google.maps.DirectionsResult {
    if (!incidents.length || result.routes.length <= 1) return result;
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < result.routes.length; i++) {
        // Score = minimum distance to ANY incident point across ALL path points
        const score = Math.min(...incidents.map(inc =>
            minDistToPoint(result.routes[i], { lat: inc.lat, lng: inc.lng })
        ));
        if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    if (bestIdx === 0) return result;
    // Swap chosen route to index 0 so DirectionsRenderer shows it as primary
    const routes = [...result.routes];
    [routes[0], routes[bestIdx]] = [routes[bestIdx], routes[0]];
    return { ...result, routes };
}

export default function LiveTracking() {
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);

    const locationState = useLocation();
    const { route, origin, destination, originStr, destStr } = locationState.state || {};

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: apiKey || "", libraries });

    // ── Monsoon-adaptive weather ──────────────────────────────────────────────
    const { weather } = useWeather();
    // ── Feedback modal state ──────────────────────────────────────────────────
    const { user } = useUser();
    const [showFeedback, setShowFeedback] = useState(false);

    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // ── GPS tracking ──────────────────────────────────────────────────────────
    // Use real device GPS via watchPosition. Fallback simulation only when
    // geolocation is unavailable (desktop/browser denied).
    const [markerLocation, setMarkerLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [usingSimulation, setUsingSimulation] = useState(false);
    const watchRef = useRef<number | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setUsingSimulation(true);
            return;
        }
        // Try to get real GPS first
        navigator.geolocation.getCurrentPosition(
            () => {
                // GPS available — watch position
                watchRef.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        setMarkerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    },
                    () => setUsingSimulation(true), // denied mid-watch
                    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
                );
            },
            () => setUsingSimulation(true), // denied on first ask
            { enableHighAccuracy: true, timeout: 5000 }
        );
        return () => {
            if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
        };
    }, []);

    // ── Simulation fallback (only when GPS is unavailable) ───────────────────
    useEffect(() => {
        if (!usingSimulation || !directions || !route?.steps) return;

        const path = directions.routes[0].overview_path;
        if (!path?.length) return;

        let startTime: number | null = null;
        const duration = 20000;
        let frame: number;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);
            const idx = Math.min(Math.floor(progress * path.length), path.length - 1);
            const pt = path[idx];
            if (pt) setMarkerLocation({ lat: pt.lat(), lng: pt.lng() });
            const step = Math.min(Math.floor(progress * route.steps.length), route.steps.length);
            setCurrentStepIndex(step);
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [usingSimulation, directions, route]);

    // ── Safety state ──────────────────────────────────────────────────────────
    const [safetyStatus, setSafetyStatus] = useState<'safe' | 'deviated' | 'stopped'>('safe');

    useEffect(() => {
        if (route?.steps?.[currentStepIndex]?.type === 'auto' && safetyStatus === 'safe') {
            const t = setTimeout(() => setSafetyStatus('deviated'), 3000);
            return () => clearTimeout(t);
        }
    }, [currentStepIndex, route, safetyStatus]);

    const handleSafe = () => setSafetyStatus('safe');
    const handleCall = () => window.location.href = 'tel:+917385875052';

    // ── Incident state ────────────────────────────────────────────────────────
    const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [showRerouteAlert, setShowRerouteAlert] = useState(false);
    const [rerouteIncident, setRerouteIncident] = useState<Incident | null>(null);
    const [rerouteLoading, setRerouteLoading] = useState(false);

    const { socket, joinRouteWatch, leaveRouteWatch, reportIncident } = useSocket();

    const routeId = buildRouteId(originStr || origin || "A", destStr || destination || "B");

    // ── FETCH existing active incidents on mount (persists after reload) ──────
    useEffect(() => {
        fetch(`${SERVER}/api/incidents?routeId=${encodeURIComponent(routeId)}`)
            .then(r => r.json())
            .then((data: any[]) => {
                const mapped: Incident[] = data.map(d => ({
                    id: d._id,
                    lat: d.lat,
                    lng: d.lng,
                    type: d.type,
                    description: d.description,
                    routeId: d.routeId,
                    reportedBy: d.reportedBy,
                    severity: d.severity,
                    createdAt: d.createdAt,
                }));
                setActiveIncidents(mapped);
            })
            .catch(() => { /* offline gracefully */ });
    }, [routeId]);

    // ── Join socket route room ────────────────────────────────────────────────
    useEffect(() => {
        joinRouteWatch(routeId);
        return () => leaveRouteWatch(routeId);
    }, [routeId]);

    // ── Real-time socket incident events ──────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleAlert = (incident: Incident) => {
            setActiveIncidents(prev =>
                prev.find(i => i.id === incident.id) ? prev : [incident, ...prev]
            );
            if (["road_blocked", "accident"].includes(incident.type)) {
                setRerouteIncident(incident);
                setShowRerouteAlert(true);
            }
        };

        const handleResolved = ({ incidentId }: { incidentId: string }) =>
            setActiveIncidents(prev => prev.filter(i => i.id !== incidentId));

        socket.on('incident_alert', handleAlert);
        socket.on('incident_resolved', handleResolved);
        return () => {
            socket.off('incident_alert', handleAlert);
            socket.off('incident_resolved', handleResolved);
        };
    }, [socket]);

    // ── Reroute helper — fetches alternatives, picks route avoiding incidents ──
    const doReroute = useCallback(() => {
        if (!isLoaded || !origin || !destination) return;
        if (typeof window === 'undefined' || !window.google?.maps) return;
        setRerouteLoading(true);
        const ds = new window.google.maps.DirectionsService();
        ds.route(
            {
                origin,
                destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: true,   // ask Google for alt routes
                avoidFerries: true,
            },
            (result, status) => {
                setRerouteLoading(false);
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                    // Pick the route that stays furthest from active incidents
                    const safe = pickSafestRoute(result, activeIncidents);
                    setDirections(safe);
                    setShowRerouteAlert(false);
                } else {
                    console.warn('Reroute failed:', status);
                }
            }
        );
    }, [isLoaded, origin, destination, activeIncidents]);

    // ── Reporter callback — auto-reroute for the person who reported it ───────
    const handleReport = useCallback((incident: Incident) => {
        const enriched: Incident = { ...incident, routeId };
        reportIncident(enriched);
        setActiveIncidents(prev => [enriched, ...prev]);
        // AUTO-REROUTE immediately for the reporter
        if (["road_blocked", "accident"].includes(incident.type)) {
            doReroute();
        }
    }, [routeId, reportIncident, doReroute]);

    // ── Directions initial fetch ──────────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded || !origin || !destination) return;
        if (typeof window === 'undefined' || !window.google?.maps) return;
        const ds = new window.google.maps.DirectionsService();
        ds.route(
            { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING, provideRouteAlternatives: true },
            (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                    let selectedIdx = 0;
                    if (route?.type === 'cheapest') selectedIdx = 1;
                    if (route?.type === 'safest' || route?.type === 'eco') selectedIdx = 2;

                    if (result.routes.length > selectedIdx) {
                        result.routes = [result.routes[selectedIdx]];
                    } else if (result.routes.length > 0) {
                        result.routes = [result.routes[0]];
                    }
                    setDirections(result);
                }
            }
        );
    }, [isLoaded, origin, destination]);

    const visibleIncidents = activeIncidents.filter(i => !dismissedIds.has(i.id));

    // Derive journey type from route for feedback modal
    const journeyFeedbackType = (() => {
        const t = route?.type;
        if (t === 'pool') return 'pool';
        if (t === 'auto' || t === 'cab') return 'auto';
        if (t === 'metro') return 'metro';
        if (t === 'bus') return 'bus';
        return 'bus';
    })();

    const journeyCompleted = route?.steps && currentStepIndex >= route.steps.length;

    return (
        <div className={`relative min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${isWomenOnly ? 'bg-pink-50 dark:bg-[#831843]' : 'bg-[#F8F8F9] dark:bg-background'}`}>
            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedback && (
                    <JourneyFeedbackModal
                        userId={user?.id ?? 'anonymous'}
                        journeyId={`${originStr ?? ''}-${destStr ?? ''}-${Date.now()}`}
                        journeyType={journeyFeedbackType}
                        origin={originStr ?? ''}
                        destination={destStr ?? ''}
                        driverId={journeyFeedbackType === 'auto' || journeyFeedbackType === 'pool' ? 'driver-001' : undefined}
                        driverName={journeyFeedbackType === 'auto' || journeyFeedbackType === 'pool' ? 'Your Driver' : undefined}
                        onClose={() => setShowFeedback(false)}
                    />
                )}
            </AnimatePresence>
            {/* Stripe Gradient Blobs */}
            {!isWomenOnly && (
                <>
                    <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#635BFF] rounded-full blur-[140px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>
                    <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-[#00D4FF] rounded-full blur-[120px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>
                </>
            )}

            <Navbar isWomenOnly={isWomenOnly} setIsWomenOnly={setIsWomenOnly} isDriverMode={isDriverMode} setIsDriverMode={setIsDriverMode} />

            {/* Weather / Monsoon Alert Banner */}
            {weather.is_raining && (
                <div className="mx-4 md:mx-8 mt-3 z-40 relative">
                    <WeatherBanner weather={weather} />
                </div>
            )}

            {/* ── Auto‑reroute alert banner (shown to ALL users on same route) ── */}
            <AnimatePresence>
                {showRerouteAlert && rerouteIncident && (
                    <motion.div
                        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
                        className="fixed top-16 left-0 right-0 z-[998] flex justify-center px-4 pt-2"
                    >
                        <div className="bg-red-600 text-white rounded-2xl shadow-2xl p-4 max-w-lg w-full flex items-center gap-4">
                            <AlertTriangle className="w-8 h-8 shrink-0 animate-pulse" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm">
                                    {INCIDENT_LABELS[rerouteIncident.type]?.emoji}&nbsp;
                                    {INCIDENT_LABELS[rerouteIncident.type]?.label} Reported Ahead!
                                </p>
                                <p className="text-xs text-red-100">
                                    {rerouteIncident.description || "Another user flagged an issue. Tap Reroute for a safer path."}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={doReroute}
                                    disabled={rerouteLoading}
                                    className="flex items-center gap-1 bg-white text-red-600 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors"
                                >
                                    <RefreshCw className={`w-3 h-3 ${rerouteLoading ? 'animate-spin' : ''}`} />
                                    Reroute
                                </button>
                                <button onClick={() => setShowRerouteAlert(false)} className="text-red-200 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Floating incident chips (top-right) ─────────────────────────── */}
            <AnimatePresence>
                {visibleIncidents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="fixed top-[5.5rem] right-4 z-[997] space-y-2 pointer-events-none"
                    >
                        {visibleIncidents.slice(0, 2).map(inc => (
                            <motion.div
                                key={inc.id}
                                initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
                                className="pointer-events-auto bg-orange-500 text-white rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg max-w-[220px]"
                            >
                                <span>{INCIDENT_LABELS[inc.type]?.emoji ?? "⚠️"}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{INCIDENT_LABELS[inc.type]?.label}</p>
                                </div>
                                <button onClick={() => setDismissedIds(s => new Set([...s, inc.id]))} className="text-orange-200 hover:text-white shrink-0 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 z-10 relative">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 animate-pulse">LIVE TRACKING ACTIVE</Badge>
                            {usingSimulation && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                                    Simulation Mode (GPS unavailable)
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#111439] dark:text-white">
                            On the way {destStr ? `to ${destStr}` : 'to Destination'}
                        </h1>
                        {visibleIncidents.length > 0 && (
                            <p className="text-sm text-orange-500 font-semibold mt-1">
                                ⚠️ {visibleIncidents.length} active incident{visibleIncidents.length > 1 ? 's' : ''} on this route
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Manual reroute — always visible */}
                        <button
                            onClick={doReroute}
                            disabled={rerouteLoading}
                            className="flex items-center gap-2 bg-[#111439] hover:bg-[#1a1f5c] disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-md"
                        >
                            <Navigation2 className={`w-4 h-4 ${rerouteLoading ? 'animate-spin' : ''}`} />
                            Change Route
                        </button>
                        <IncidentReporter
                            routeId={routeId}
                            userLat={markerLocation?.lat ?? 18.5204}
                            userLng={markerLocation?.lng ?? 73.8567}
                            onReport={handleReport}
                        />
                        <ShareTrackingWidget />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Live Map */}
                    <div className="lg:col-span-2 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white dark:border-[#111439] min-h-[600px] relative">
                        <MapComponent
                            isLoaded={isLoaded}
                            directions={directions}
                            simulationLocation={markerLocation}
                            currentStepType={route?.steps?.[currentStepIndex]?.type}
                            incidents={visibleIncidents}
                        />

                    </div>

                    {/* RIGHT: Panels */}
                    <div className="space-y-6">
                        <SafetyMonitor status={safetyStatus} lastUpdated="Just now" onSafeClick={handleSafe} onCallClick={handleCall} />

                        {route?.steps && (
                            <JourneyChecklist steps={route.steps} currentStepIndex={currentStepIndex} />
                        )}

                        {/* Rate Journey CTA — shown after journey completes */}
                        {journeyCompleted && !showFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-[#635BFF] to-[#00D4FF] rounded-2xl p-4 text-white shadow-lg"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Journey Complete! 🎉</p>
                                        <p className="text-white/80 text-xs">Your feedback helps improve routes</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFeedback(true)}
                                    className="w-full bg-white text-[#635BFF] font-bold py-2.5 rounded-xl text-sm hover:bg-white/90 transition-all"
                                >
                                    ⭐ Rate Your Journey
                                </button>
                                <p className="text-[10px] text-white/60 text-center mt-2">Earn rewards at 25, 50, 75 & 100 feedbacks!</p>
                            </motion.div>
                        )}

                        {/* Active incidents panel */}
                        {visibleIncidents.length > 0 && (
                            <Card className="border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Route Incidents ({visibleIncidents.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {visibleIncidents.map(inc => (
                                        <div key={inc.id} className="flex items-start gap-2 text-xs">
                                            <span className="text-base">{INCIDENT_LABELS[inc.type]?.emoji}</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-orange-800 dark:text-orange-200">{INCIDENT_LABELS[inc.type]?.label}</p>
                                                {inc.description && <p className="text-orange-600/80 dark:text-orange-300/60">{inc.description}</p>}
                                                <p className="text-orange-400 mt-0.5">
                                                    {new Date(inc.createdAt).toLocaleTimeString()}
                                                    {" · expires ~90 min after report"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setDismissedIds(s => new Set([...s, inc.id]))}
                                                className="text-orange-300 hover:text-orange-500 transition-colors"
                                            ><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                    <button onClick={doReroute} className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-xl mt-1 transition-colors shadow-sm">
                                        <RefreshCw className="w-3.5 h-3.5" /> Reroute Away From Incidents
                                    </button>
                                </CardContent>
                            </Card>
                        )}

                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/20 text-center space-y-4 shadow-sm">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                            <div>
                                <h3 className="font-bold text-red-700 dark:text-red-300">Emergency Help</h3>
                                <p className="text-sm text-red-600/80 dark:text-red-300/60 max-w-[200px] mx-auto">
                                    Press and hold the SOS button for 3 seconds to alert police.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SOSButton />
        </div>
    );
}
