import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import KPIMetricsGrid from "./KPIMetricsGrid";
import { useNavigate } from "react-router-dom";

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
    segments?: any[];
}

interface RouteCardProps {
    route: RouteOption;
    selected: boolean;
    onSelect: (route: RouteOption) => void;
    originStr: string;
    destStr: string;
    originCoords: string;
    destCoords: string;
}

export default function RouteCard({ route, selected, onSelect, originStr, destStr, originCoords, destCoords }: RouteCardProps) {
    const navigate = useNavigate();

    return (
        <Card
            className={`cursor-pointer transition-all duration-300 border-2 overflow-hidden ${selected ? 'border-[#2FCE65] shadow-lg shadow-[#2FCE65]/10 bg-[#2FCE65]/5' : 'border-transparent hover:border-gray-200 dark:hover:border-white/10 bg-white dark:bg-card'}`}
            onClick={() => {
                onSelect(route);
                navigate('/route-details', {
                    state: {
                        route,
                        originStr,
                        destStr,
                        originCoords,
                        destCoords
                    }
                });
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
            </CardContent>
        </Card>
    );
}
