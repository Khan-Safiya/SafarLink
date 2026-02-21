import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Navigation, Leaf, ShieldCheck, MapPin, Ticket } from "lucide-react";
import JourneyTimeline from "../components/JourneyTimeline";
import Navbar from "../components/Navbar";
import { useState } from "react";

export default function RouteDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);

    // Expecting route state to be passed from Dashboard navigation
    const route = location.state?.route;
    const originStr = location.state?.originStr;
    const destStr = location.state?.destStr;
    const originCoords = location.state?.originCoords;
    const destCoords = location.state?.destCoords;

    if (!route) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <p className="text-gray-500 mb-4">No route data provided.</p>
                <Button onClick={() => navigate('/dashboard')} variant="outline">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className={`relative min-h-screen font-sans transition-colors duration-500 flex flex-col overflow-x-hidden ${isWomenOnly ? 'bg-pink-50 dark:bg-[#831843]' : 'bg-[#F8F8F9] dark:bg-background'}`}>
            {/* Stripe Gradient Blobs */}
            {!isWomenOnly && (
                <>
                    <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#635BFF] rounded-full blur-[140px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>
                    <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-[#00D4FF] rounded-full blur-[120px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>
                </>
            )}
            <Navbar
                isWomenOnly={isWomenOnly}
                setIsWomenOnly={setIsWomenOnly}
                isDriverMode={isDriverMode}
                setIsDriverMode={setIsDriverMode}
            />

            <main className="flex-grow p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8 z-10 relative mt-4">
                {/* Top Nav */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#111439] transition-colors dark:text-gray-400 dark:hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Routing
                </button>

                {/* Header Summary Card */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-card overflow-hidden">
                    <div className={`p-6 bg-gradient-to-br ${route.type === 'fastest' ? 'from-blue-500/10 to-transparent' :
                        route.type === 'cheapest' ? 'from-[#635BFF]/10 to-transparent' :
                            'from-amber-500/10 to-transparent'
                        }`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-[#111439] dark:text-white mb-2">
                                    Journey Plan
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 text-[#635BFF]" /> {originStr || 'Current Location'}
                                    <ArrowLeft className="w-4 h-4 rotate-180 mx-1" />
                                    <MapPin className="w-4 h-4 text-[#00D4FF]" /> {destStr || 'Destination'}
                                </div>
                            </div>
                            <Badge variant="outline" className={`capitalize px-3 py-1 ${route.type === 'fastest' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                route.type === 'cheapest' ? 'border-[#635BFF]/30 text-[#635BFF] bg-[#635BFF]/10' :
                                    'border-amber-200 text-amber-700 bg-amber-50'
                                }`}>
                                {route.type}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-gray-100 dark:border-white/5">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</p>
                                <p className="font-bold text-lg text-[#111439] dark:text-white">{route.duration}</p>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-gray-100 dark:border-white/5">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><span className="text-[#635BFF] font-bold">₹</span> Cost</p>
                                <p className="font-bold text-lg text-[#635BFF] dark:text-indigo-400">₹{route.price}</p>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-gray-100 dark:border-white/5">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Leaf className="w-3 h-3 text-green-500" /> CO2</p>
                                <p className="font-bold text-lg text-[#111439] dark:text-white">{route.co2}g</p>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-gray-100 dark:border-white/5">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500" /> Safety</p>
                                <p className="font-bold text-lg text-[#111439] dark:text-white">{route.safetyScore}%</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Journey Timeline Breakdown */}
                <div className="px-2">
                    <h2 className="text-lg font-bold text-[#111439] dark:text-white mb-6">Detailed Segments</h2>
                    <JourneyTimeline steps={route.steps || []} />
                </div>

                {/* Bottom Spacer for fixed Action Footer */}
                <div className="h-24"></div>
            </main>

            {/* Fixed Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-200 dark:border-white/10 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-3xl mx-auto flex gap-3 items-center">
                    <div className="hidden sm:block flex-grow">
                        <p className="text-sm font-medium text-[#111439] dark:text-white">Ready to depart?</p>
                        <p className="text-xs text-gray-500">Live safety tracking will activate automatically.</p>
                    </div>
                    {/* Book Tickets */}
                    <Button
                        onClick={() => navigate('/booking', {
                            state: {
                                origin: originStr,
                                destination: destStr,
                                routeType: route.type,
                                fareInr: route.price,
                                segments: route.segments ?? [],
                            }
                        })}
                        variant="outline"
                        className="px-5 h-12 font-bold border-[#111439] text-[#111439] hover:bg-[#1a1f5c] hover:text-white transition-colors flex gap-2"
                    >
                        <Ticket className="w-4 h-4" />
                        Book Tickets
                    </Button>
                    {/* Start Journey */}
                    <Button
                        onClick={() => navigate('/tracking', {
                            state: {
                                route,
                                origin: originCoords,
                                destination: destCoords,
                                originStr,
                                destStr,
                            }
                        })}
                        className="flex-1 sm:flex-none px-8 bg-[#635BFF] hover:bg-indigo-700 text-white flex gap-2 shadow-lg shadow-[#635BFF]/20 h-12 text-lg font-bold"
                    >
                        <Navigation className="w-5 h-5" />
                        Start Journey
                    </Button>
                </div>
            </div>
        </div>
    );
}
