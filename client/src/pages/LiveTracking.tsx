import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MapComponent from "../components/MapComponent";
import { useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, AlertCircle } from "lucide-react";
import SOSButton from "../components/SOSButton";
import ShareTrackingWidget from "../components/ShareTrackingWidget";
import SafetyMonitor from "../components/SafetyMonitor";
import JourneyChecklist from "../components/JourneyChecklist";
import { useLocation } from "react-router-dom";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

export default function LiveTracking() {
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);

    // Route tracking state
    const location = useLocation();
    const { route, origin, destination } = location.state || {};
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [markerLocation, setMarkerLocation] = useState<google.maps.LatLngLiteral | null>(null);

    // Safety Status State
    const [safetyStatus, setSafetyStatus] = useState<'safe' | 'deviated' | 'stopped'>('safe');

    // Simulate auto route deviation when user is on 'auto' segment
    useEffect(() => {
        if (route?.steps?.[currentStepIndex]?.type === 'auto' && safetyStatus === 'safe') {
            const timer = setTimeout(() => {
                // Determine we are 500m off route
                setSafetyStatus('deviated');
            }, 3000); // Trigger 3 seconds into the auto segment simulation
            return () => clearTimeout(timer);
        }
    }, [currentStepIndex, route, safetyStatus]);

    const handleSafe = () => setSafetyStatus('safe');
    const handleCall = () => window.location.href = 'tel:+917385875052';

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: apiKey || "", libraries });

    // Fetch Directions for the path
    useEffect(() => {
        if (isLoaded && origin && destination && window.google) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route({
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);
                }
            });
        }
    }, [isLoaded, origin, destination]);

    // Live Tracking Simulation Loop
    useEffect(() => {
        if (!directions || !route?.steps) return;

        const path = directions.routes[0].overview_path;
        if (!path || path.length === 0) return;

        let startTime: number | null = null;
        const duration = 20000; // 20 seconds for the entire journey demo
        let animationFrame: number;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Interpolate position on path
            const pointIndex = Math.min(Math.floor(progress * path.length), path.length - 1);
            const point = path[pointIndex];
            if (point) {
                setMarkerLocation({ lat: point.lat(), lng: point.lng() });
            }

            // Update step index based on progress
            const totalSteps = route.steps.length;
            const currentStep = Math.min(Math.floor(progress * totalSteps), totalSteps);
            setCurrentStepIndex(currentStep);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setMarkerLocation({ lat: path[path.length - 1].lat(), lng: path[path.length - 1].lng() });
                setCurrentStepIndex(totalSteps);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [directions, route]);

    // apiKey already declared

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${isWomenOnly ? 'bg-pink-50 dark:bg-[#831843]' : 'bg-[#F4FDF7] dark:bg-background'}`}>
            <Navbar
                isWomenOnly={isWomenOnly}
                setIsWomenOnly={setIsWomenOnly}
                isDriverMode={isDriverMode}
                setIsDriverMode={setIsDriverMode}
            />

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 z-10 relative">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 animate-pulse">LIVE TRACKING ACTIVE</Badge>
                            <span className="text-sm text-gray-500">Ride ID: #SAF-8821</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#07503E] dark:text-white">
                            En Route to Home
                        </h1>
                    </div>
                    <ShareTrackingWidget />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Live Map */}
                    <div className="lg:col-span-2 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white dark:border-[#0a0a0a] min-h-[600px] relative">
                        <MapComponent
                            isLoaded={isLoaded}
                            directions={directions}
                            simulationLocation={markerLocation}
                            currentStepType={route?.steps?.[currentStepIndex]?.type}
                        />

                        {/* Driver Details Overlay */}
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-black/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">👨‍✈️</div>
                                <div>
                                    <h3 className="font-bold text-[#07503E] dark:text-white">Vikram Singh</h3>
                                    <p className="text-xs text-gray-500">Toyota Etios • MH 12 AB 1234</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="rounded-full bg-green-50 text-green-600 hover:bg-green-100">
                                    <Phone className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Safety Console */}
                    <div className="space-y-6">
                        <SafetyMonitor
                            status={safetyStatus}
                            lastUpdated="Just now"
                            onSafeClick={handleSafe}
                            onCallClick={handleCall}
                        />

                        {route?.steps && (
                            <JourneyChecklist
                                steps={route.steps}
                                currentStepIndex={currentStepIndex}
                            />
                        )}

                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/20 text-center space-y-4">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                            <div>
                                <h3 className="font-bold text-red-700 dark:text-red-300">Emergency Help</h3>
                                <p className="text-sm text-red-600/80 dark:text-red-300/60 max-w-[200px] mx-auto">
                                    Press and hold the SOS button for 3 seconds to alert police.
                                </p>
                            </div>
                            {/* The Floating SOS button handles the actual action, this is just info context */}
                        </div>
                    </div>
                </div>

            </main>

            <SOSButton />
        </div>
    );
}
