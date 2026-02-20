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

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

export default function LiveTracking() {
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);

    // Safety Status State
    const [safetyStatus, setSafetyStatus] = useState<'safe' | 'deviated' | 'stopped'>('safe');

    // Simulate a safety event after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setSafetyStatus('deviated');
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: apiKey || "", libraries });

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
                        <MapComponent isLoaded={isLoaded} />

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
                        <SafetyMonitor status={safetyStatus} lastUpdated="Just now" />

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Emergency Contacts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { name: "Mom", phone: "+91 98765 43210", relation: "Parent" },
                                    { name: "Rahul (Brother)", phone: "+91 91234 56789", relation: "Sibling" }
                                ].map((contact, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                                        <div>
                                            <p className="font-bold text-[#07503E] dark:text-white">{contact.name}</p>
                                            <p className="text-xs text-gray-500">{contact.relation}</p>
                                        </div>
                                        <Button size="sm" variant="outline" className="h-8">Alert</Button>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full border-dashed">+ Add Trusted Contact</Button>
                            </CardContent>
                        </Card>

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
