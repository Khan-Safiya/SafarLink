import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KPIMetricsGrid from "./KPIMetricsGrid";
import JourneyTimeline from "./JourneyTimeline";

export interface RouteOption {
    id: string;
    type: 'fastest' | 'cheapest' | 'safest' | 'eco';
    duration: string;
    distance: string;
    price: number;
    calories: number;
    co2: number; // in grams
    safetyScore: number; // 0-100
    tags: string[];
    steps?: any[]; // For timeline
}

interface RouteCardProps {
    route: RouteOption;
    selected: boolean;
    onSelect: (route: RouteOption) => void;
}

export default function RouteCard({ route, selected, onSelect }: RouteCardProps) {
    const [expanded, setExpanded] = useState(false);

    // Mock steps if not provided
    const steps = route.steps || [
        { type: 'walk', duration: '5 mins', description: 'Walk from current location' },
        { type: 'metro', duration: '15 mins', description: 'Purple Line: Civil Court to Vanaz' },
        { type: 'auto', duration: '8 mins', description: 'Shared Auto to Destination' }
    ];

    return (
        <Card
            className={`cursor-pointer transition-all duration-300 border-2 overflow-hidden ${selected ? 'border-[#2FCE65] shadow-lg shadow-[#2FCE65]/10 bg-[#2FCE65]/5' : 'border-transparent hover:border-gray-200 dark:hover:border-white/10 bg-white dark:bg-card'}`}
            onClick={() => {
                onSelect(route);
                setExpanded(!expanded);
            }}
        >
            <CardContent className="p-0">
                {/* Header Section */}
                <div className="p-4 md:p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2 items-center">
                            {route.type === 'fastest' && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">⚡ Fastest</Badge>}
                            {route.type === 'cheapest' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">💰 Cheapest</Badge>}
                            {route.type === 'safest' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">🛡️ Safest</Badge>}
                            {route.type === 'eco' && <Badge className="bg-[#2FCE65]/20 text-[#07503E] hover:bg-[#2FCE65]/20 border-[#2FCE65]/30">🌱 Eco-Friendly</Badge>}
                        </div>
                        {selected && <CheckCircle2 className="text-[#2FCE65] w-6 h-6" />}
                    </div>

                    <KPIMetricsGrid
                        duration={route.duration}
                        distance={route.distance}
                        price={route.price}
                        calories={route.calories}
                        safetyScore={route.safetyScore}
                        co2={route.co2}
                    />
                </div>

                {/* Expanded Details - The Journey Timeline */}
                <AnimatePresence>
                    {(selected || expanded) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20"
                        >
                            <div className="p-5">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Journey Segments</h4>
                                <JourneyTimeline steps={steps} />

                                <div className="mt-6 flex justify-center">
                                    <button className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-200">
                                        <ChevronUp className="w-3 h-3" /> Hide Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!selected && !expanded && (
                    <div className="h-1 bg-gray-100 dark:bg-white/5 mx-5 mb-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-200 dark:bg-white/10 w-1/3"></div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
