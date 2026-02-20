import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { MapPin, Sparkles, Brain, Leaf, TrendingUp } from "lucide-react";
import { useJsApiLoader } from '@react-google-maps/api';
import MapComponent from "../components/MapComponent";
import RouteCard from "../components/RouteCard";
import type { RouteOption } from "../components/RouteCard";
import SOSButton from "../components/SOSButton";
import { setupInterceptors } from "../api/axios";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import Footer from "../components/Footer";
import LocationInput from "../components/LocationInput";
import ServicesGrid from "../components/ServicesGrid";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

export default function Dashboard() {
    const { getToken } = useAuth();
    const [isDriverMode, setIsDriverMode] = useState(false);
    const [isWomenOnly, setIsWomenOnly] = useState(false);

    const [destination, setDestination] = useState("");
    const [startLocationAddress, setStartLocationAddress] = useState("");
    const [toCoords, setToCoords] = useState<google.maps.LatLngLiteral | null>(null);
    const [directionsHelp, setDirectionsHelp] = useState<google.maps.DirectionsResult | null>(null);

    // Using the new RouteOption type
    const [routes, setRoutes] = useState<RouteOption[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
    const [showRoutes, setShowRoutes] = useState(false);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey || "",
        libraries
    });

    // Mock geolocation for "From" (Current Location)
    const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>({ lat: 18.5204, lng: 73.8567 }); // Pune default

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setStartLocationAddress("Current Location");
                },
                () => console.log("Error getting location")
            );
        }
    }, []);

    const handleStartLocationSelect = (place: google.maps.places.PlaceResult) => {
        if (!place.geometry?.location) return;
        setCurrentLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        });
        setStartLocationAddress(place.formatted_address || place.name || "");
    };

    useEffect(() => {
        if (currentLocation && toCoords && isLoaded && window.google) {
            const directionsService = new google.maps.DirectionsService();

            directionsService.route({
                origin: currentLocation,
                destination: toCoords,
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: true
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirectionsHelp(result);
                } else {
                    console.error("Directions request failed due to " + status);
                }
            });
        }
    }, [currentLocation, toCoords, isLoaded]);

    const handleSearch = async (place: google.maps.places.PlaceResult) => {
        if (!place.geometry?.location) return;

        setToCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        });
        setDestination(place.formatted_address || place.name || "");
        setShowRoutes(true);

        try {
            setupInterceptors(getToken);
            // Simulate API call delay
            setTimeout(() => {
                const mockRoutes: RouteOption[] = [
                    { id: '1', type: 'fastest', duration: '45 mins', distance: '15 km', price: 150, calories: 120, co2: 600, safetyScore: 88, tags: [] },
                    { id: '2', type: 'cheapest', duration: '65 mins', distance: '14 km', price: 45, calories: 210, co2: 120, safetyScore: 92, tags: [] },
                    { id: '3', type: 'safest', duration: '55 mins', distance: '16 km', price: 200, calories: 100, co2: 650, safetyScore: 98, tags: [] },
                ];
                setRoutes(mockRoutes);
                setSelectedRoute(mockRoutes[0]);
            }, 1000);

        } catch (err) {
            console.error("Failed to fetch routes", err);
        }
    };

    return (
        <div className={`relative min-h-screen font-sans transition-colors duration-500 flex flex-col overflow-x-hidden ${isWomenOnly ? 'bg-pink-50 dark:bg-[#831843]' : 'bg-[#F4FDF7] dark:bg-background'}`}>
            <Navbar
                isWomenOnly={isWomenOnly}
                setIsWomenOnly={setIsWomenOnly}
                isDriverMode={isDriverMode}
                setIsDriverMode={setIsDriverMode}
            />

            <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 z-10 relative mt-4">

                {/* Hero Section with Search & Cards */}
                <div className="flex flex-col items-center justify-center space-y-12 py-10">

                    {/* Header Text */}
                    <div className="text-center space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-6xl font-bold tracking-tight"
                        >
                            <span className="text-[#07503E] dark:text-white block">Precision of experts.</span>
                            <span className="text-[#2FCE65] block mt-2">Speed of AI.</span>
                        </motion.h1>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                            Ask EcoPilot to plan your journey, optimize for carbon impact, or find the safest path in seconds.
                        </p>
                    </div>

                    {/* Search Interface (Image 2) */}
                    <div className="w-full max-w-2xl">
                        <div className="relative flex flex-col gap-6">
                            {/* Connector Line */}
                            <div className="absolute left-[27px] top-[60px] bottom-[60px] w-0.5 border-l-2 border-dashed border-gray-300 dark:border-gray-700 z-0" />

                            {/* Starting Location */}
                            <div className="bg-white dark:bg-card p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 relative z-10">
                                <div className="flex items-start gap-4 p-4">
                                    <div className="mt-2">
                                        <MapPin className="w-6 h-6 text-blue-500 fill-blue-100" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-sm font-bold text-[#07503E] dark:text-gray-200">Starting Location</label>
                                        <LocationInput
                                            placeholder="Enter starting point"
                                            value={startLocationAddress}
                                            onChange={setStartLocationAddress}
                                            onPlaceSelected={handleStartLocationSelect}
                                            className="bg-gray-50 dark:bg-black/20 border-transparent h-12 text-lg w-full"
                                            icon={<div className="hidden" />} // Hide default icon
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Destination */}
                            <div className="bg-white dark:bg-card p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 relative z-10">
                                <div className="flex items-start gap-4 p-4">
                                    <div className="mt-2">
                                        <MapPin className="w-6 h-6 text-[#2FCE65] fill-green-100" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-sm font-bold text-[#07503E] dark:text-gray-200">Destination</label>
                                        <LocationInput
                                            placeholder="Enter destination"
                                            value={destination}
                                            onChange={setDestination}
                                            onPlaceSelected={handleSearch}
                                            className="bg-gray-50 dark:bg-black/20 border-transparent h-12 text-lg w-full"
                                            icon={<div className="hidden" />} // Hide default icon
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Find My Ride Button */}
                        <div className="mt-8 flex justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-[#07503E] text-white px-12 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[#064031] transition-all"
                                onClick={() => { if (destination) setShowRoutes(true); }}
                            >
                                Find My Ride
                            </motion.button>
                        </div>
                    </div>

                    {/* Feature Cards (Image 1) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
                        {/* Card 1 */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-card p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-[#07503E] dark:text-green-400">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#07503E] dark:text-white mb-3">Route Intelligence</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                AI-optimized paths tailored for speed, safety, and comfort.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-card p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-[#07503E] dark:text-green-400">
                                <Leaf className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#07503E] dark:text-white mb-3">Carbon Impact</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                Real-time CO2 tracking and offsets for every mile you travel.
                            </p>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-card p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-[#07503E] dark:text-green-400">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#07503E] dark:text-white mb-3">Cost Optimization</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                Smart pooling algorithms to reduce your daily travel spend.
                            </p>
                        </motion.div>
                    </div>

                </div>

                {/* Services Grid & Map Section (Keep existing but push down) */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-[#07503E] dark:text-white">Explore Services</h2>
                    <ServicesGrid />



                    {/* Main Content Area: Map & Routes (Conditional) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Map Container */}
                        <div className={`lg:col-span-2 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 min-h-[500px] relative ${isWomenOnly ? 'shadow-pink-900/10 border-white dark:border-pink-950' : 'shadow-[#07503E]/10 dark:shadow-black/50 border-white dark:border-[#0a0a0a]'}`}>
                            <MapComponent isLoaded={isLoaded} directions={directionsHelp} />
                        </div>

                        {/* Right: Route Options (Only show if searched) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className={`text-xl font-bold ${isWomenOnly ? 'text-pink-900 dark:text-white' : 'text-[#07503E] dark:text-white'}`}>
                                    {showRoutes ? "Suggested Routes" : "Nearby Activity"}
                                </h2>
                                {showRoutes && <Badge variant="outline" className="border-[#2FCE65] text-[#2FCE65]">3 Options</Badge>}
                            </div>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {showRoutes ? (
                                    routes.map(route => (
                                        <RouteCard
                                            key={route.id}
                                            route={route}
                                            selected={selectedRoute?.id === route.id}
                                            onSelect={setSelectedRoute}
                                        />
                                    ))
                                ) : (
                                    <Card className="border-dashed bg-transparent shadow-none">
                                        <CardContent className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                                            <MapPin className="w-12 h-12 mb-4 text-gray-300" />
                                            <p className="text-sm">Enter a destination above to see route options.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity / Safety Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <Card className={`rounded-3xl border shadow-sm ${isWomenOnly ? 'bg-white/80 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/20' : 'bg-white/80 dark:bg-card border-emerald-100 dark:border-border'}`}>
                            <CardHeader>
                                <CardTitle className={isWomenOnly ? 'text-pink-900 dark:text-white' : 'text-[#07503E] dark:text-white'}>Recent Activity</CardTitle>
                                <CardDescription>Your last 3 journeys with EcoPilot.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWomenOnly ? 'bg-pink-100 text-pink-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className={`font-medium ${isWomenOnly ? 'text-pink-900 dark:text-gray-200' : 'text-[#07503E] dark:text-gray-200'}`}>Work Commute</p>
                                                <p className="text-xs text-gray-500">2 days ago • 14km</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={isWomenOnly ? 'bg-pink-50 text-pink-700' : 'bg-emerald-50 text-emerald-700'}>Completed</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className={`rounded-3xl border shadow-sm ${isWomenOnly ? 'bg-white/80 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/20' : 'bg-white/80 dark:bg-card border-emerald-100 dark:border-border'}`}>
                            <CardHeader>
                                <CardTitle className={isWomenOnly ? 'text-pink-900 dark:text-white' : 'text-[#07503E] dark:text-white'}>Safety Insights</CardTitle>
                                <CardDescription>Real-time updates for your area.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-xl border ${isWomenOnly ? 'bg-pink-50 border-pink-100 text-pink-900' : 'bg-emerald-50 border-emerald-100 text-[#07503E]'}`}>
                                        <h4 className="font-bold flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4" /> High Safety Score
                                        </h4>
                                        <p className="text-sm opacity-80">Your current location has a 98% safety rating based on recent community reports.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>

            <SOSButton />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${isWomenOnly ? 'bg-pink-500/5 dark:bg-pink-500/10' : 'bg-[#2FCE65]/5 dark:bg-[#2FCE65]/10'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${isWomenOnly ? 'bg-rose-500/5 dark:bg-rose-500/10' : 'bg-teal-500/5 dark:bg-teal-500/10'}`}></div>
            </div>
            {/* Footer */}
            <Footer />
        </div>
    );
}
