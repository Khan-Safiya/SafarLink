import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Search,
    MapPin,
    Clock,
    Ruler,
    Bus,
    Train,
    Car,
    AlertCircle,
    ArrowRight,
    Loader2,
    Navigation,
    IndianRupee,
    Zap,
    Star,
    TrendingDown,
    MessageSquare,
    BarChart3,
    List,
    ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchChatbotRoute } from "../api/chatbotApi";
import type { Root, TransitOption, Route, FareOption } from "../types/chatbotRoute";
import Navbar from "../components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Icon helpers ───────────────────────────────────────────────────────────────

const MODE_META: Record<
    string,
    { icon: React.ReactElement; color: string; bg: string; activeBg: string; label: string }
> = {
    "Bus": {
        icon: <Bus className="w-4 h-4" />,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30",
        activeBg: "bg-red-600 text-white border-red-600",
        label: "Bus",
    },
    "Metro / Subway": {
        icon: <Train className="w-4 h-4" />,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30",
        activeBg: "bg-purple-600 text-white border-purple-600",
        label: "Metro / Subway",
    },
    "Auto / Cab": {
        icon: <Car className="w-4 h-4" />,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30",
        activeBg: "bg-amber-600 text-white border-amber-600",
        label: "Auto / Cab",
    },
};

function getMeta(mode: string) {
    return (
        MODE_META[mode] ?? {
            icon: <Navigation className="w-4 h-4" />,
            color: "text-gray-600 dark:text-gray-400",
            bg: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700",
            activeBg: "bg-gray-700 text-white border-gray-700",
            label: mode,
        }
    );
}

// ─── Route card ─────────────────────────────────────────────────────────────────

function RouteCard({ route, index, activeMode }: { route: Route; index: number; activeMode: string }) {
    const navigate = useNavigate();

    // Build adapted route state for RouteDetails page
    const handleClick = () => {
        // Convert chatbot route steps into the format JourneyTimeline expects
        const adaptedSteps = route.steps.map((s) => {
            let type = "walk";
            const m = s.travel_mode.toUpperCase();
            if (m === "TRANSIT") {
                const vt = (s.transit_info?.vehicle_type || "").toLowerCase();
                if (vt.includes("metro") || vt.includes("subway")) type = "metro";
                else if (vt.includes("bus")) type = "bus";
                else type = "bus";
            } else if (m === "DRIVING") type = "auto";
            else if (m === "WALKING") type = "walk";
            return {
                type,
                duration: s.duration,
                description: s.instruction,
            };
        });

        const adaptedRoute = {
            type: index === 0 ? "fastest" : index === 1 ? "cheapest" : "safest",
            duration: route.total_duration,
            distance: route.total_distance,
            price: 0,
            calories: 0,
            co2: 0,
            safetyScore: 90,
            steps: adaptedSteps,
            // Keep raw chatbot route for reference
            chatbotRoute: route,
        };

        navigate("/route-details", {
            state: {
                route: adaptedRoute,
                originStr: route.origin,
                destStr: route.destination,
                originCoords: null,
                destCoords: null,
            },
        });
    };

    // Count distinct modes
    const modes = [...new Set(route.steps.map((s) => s.travel_mode))];

    return (
        <Card
            className="overflow-hidden border-2 border-transparent hover:border-[#635BFF] hover:shadow-lg hover:shadow-[#635BFF]/10 cursor-pointer transition-all duration-300 bg-white/80 backdrop-blur-sm dark:bg-card"
            onClick={handleClick}
        >
            <CardContent className="p-0">
                {/* Header Section */}
                <div className="p-4 md:p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2 items-center">
                            {index === 0 && (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                    ⚡ Fastest
                                </Badge>
                            )}
                            {index === 1 && (
                                <Badge className="bg-[#635BFF]/10 text-[#635BFF] hover:bg-[#635BFF]/20 border-[#635BFF]/30">
                                    💰 Cheapest
                                </Badge>
                            )}
                            {index >= 2 && (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                                    🛡️ Recommended
                                </Badge>
                            )}
                            <span className="text-xs text-gray-400 font-medium">
                                via {activeMode}
                            </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>

                    {/* Origin → Destination */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-4 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-blue-400" />
                        <span className="truncate">{route.origin}</span>
                        <ArrowRight className="w-3 h-3 mx-0.5 shrink-0" />
                        <MapPin className="w-3 h-3 shrink-0 text-[#635BFF]" />
                        <span className="truncate">{route.destination}</span>
                    </div>

                    {/* KPI Grid – matches Dashboard style */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Duration */}
                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Time</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{route.total_duration}</p>
                            <p className="text-[10px] text-gray-400">{route.total_distance}</p>
                        </div>

                        {/* Steps */}
                        <div className="p-3 bg-[#635BFF]/5 dark:bg-[#635BFF]/10 rounded-xl border border-[#635BFF]/10 dark:border-[#635BFF]/20">
                            <div className="flex items-center gap-2 mb-1 text-[#635BFF] dark:text-[#635BFF]">
                                <List className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Steps</span>
                            </div>
                            <p className="font-bold text-[#111439] dark:text-white text-sm">{route.steps.length}</p>
                            <p className="text-[10px] text-[#635BFF]/80 dark:text-[#635BFF]/60">segments</p>
                        </div>

                        {/* Modes */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
                                <Navigation className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Modes</span>
                            </div>
                            <p className="font-bold text-blue-900 dark:text-blue-100 text-sm">{modes.length}</p>
                            <p className="text-[10px] text-blue-700/60 dark:text-blue-300/60">transport types</p>
                        </div>

                        {/* Route */}
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                            <div className="flex items-center gap-2 mb-1 text-green-600 dark:text-green-400">
                                <Ruler className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Route</span>
                            </div>
                            <p className="font-bold text-green-900 dark:text-green-100 text-sm">#{route.route_number}</p>
                            <p className="text-[10px] text-green-700/60 dark:text-green-300/60">tap for details</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Transit Mode Panel ─────────────────────────────────────────────────────────

function TransitPanel({ option }: { option: TransitOption }) {
    if (!option.available) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
                <AlertCircle className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    No {option.mode} routes available for this journey.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {option.routes.map((route, i) => (
                <RouteCard key={route.route_number} route={route} index={i} activeMode={option.mode} />
            ))}
        </div>
    );
}

// ─── Fare Row ───────────────────────────────────────────────────────────────────

function FareRow({ fare, rank }: { fare: FareOption; rank?: number }) {
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
            {rank !== undefined && (
                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                    {rank}
                </span>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {fare.mode}
                    {fare.actual_fare && (
                        <span className="ml-2 text-[10px] font-normal text-gray-400">
                            ({fare.actual_fare})
                        </span>
                    )}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    Route {fare.route_number} · {fare.distance_km} km · {fare.duration_minutes} min
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#111439] dark:text-white flex items-center gap-0.5 justify-end">
                    <IndianRupee className="w-3 h-3" />
                    {fare.estimated_fare_inr}
                </p>
                <p className="text-[10px] text-gray-400">{fare.fare_source}</p>
            </div>
        </div>
    );
}

// ─── Highlight Fare Card ────────────────────────────────────────────────────────

function HighlightFareCard({
    fare,
    label,
    icon,
    accent,
}: {
    fare: FareOption;
    label: string;
    icon: React.ReactElement;
    accent: string;
}) {
    return (
        <div className={`rounded-xl border p-3 flex flex-col gap-1.5 ${accent}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
                {icon}
                {label}
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fare.mode}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {fare.distance_km} km · {fare.duration_minutes} min
            </p>
            <p className="text-lg font-extrabold text-[#111439] dark:text-white flex items-center gap-0.5 mt-auto">
                <IndianRupee className="w-4 h-4" />
                {fare.estimated_fare_inr}
            </p>
        </div>
    );
}

// ─── Fares Panel ────────────────────────────────────────────────────────────────

function FaresPanel({ fares }: { fares: Root["fares"] }) {
    const [fareView, setFareView] = useState<"cost" | "speed">("cost");

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Fare Comparison</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {fares.origin}
                            <ArrowRight className="w-2.5 h-2.5" />
                            {fares.destination}
                        </p>
                    </div>
                </div>
                {/* Toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 text-xs font-semibold">
                    <button
                        onClick={() => setFareView("cost")}
                        className={`px-3 py-1.5 transition-colors ${fareView === "cost"
                            ? "bg-[#111439] text-white"
                            : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                    >
                        <TrendingDown className="w-3 h-3 inline mr-1" />
                        By Cost
                    </button>
                    <button
                        onClick={() => setFareView("speed")}
                        className={`px-3 py-1.5 transition-colors ${fareView === "speed"
                            ? "bg-[#111439] text-white"
                            : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                    >
                        <Zap className="w-3 h-3 inline mr-1" />
                        By Speed
                    </button>
                </div>
            </div>

            {/* Highlights: cheapest / fastest / best value */}
            <div className="px-5 py-4 grid grid-cols-3 gap-3">
                <HighlightFareCard
                    fare={fares.cheapest}
                    label="Cheapest"
                    icon={<TrendingDown className="w-3 h-3" />}
                    accent="bg-[#635BFF]/5 dark:bg-[#635BFF]/10 border-[#635BFF]/20 dark:border-[#635BFF]/30 text-[#635BFF] dark:text-indigo-400"
                />
                <HighlightFareCard
                    fare={fares.fastest}
                    label="Fastest"
                    icon={<Zap className="w-3 h-3" />}
                    accent="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400"
                />
                <HighlightFareCard
                    fare={fares.best_value}
                    label="Best Value"
                    icon={<Star className="w-3 h-3" />}
                    accent="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
                />
            </div>

            {/* Ranked list */}
            <div className="px-5 pb-5">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {fareView === "cost" ? "All options by cost" : "All options by speed"}
                    </p>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={fareView}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                    >
                        {(fareView === "cost" ? fares.ranked_by_cost : fares.ranked_by_speed).map(
                            (fare, i) => (
                                <FareRow key={`${fare.mode}-${fare.route_number}-${i}`} fare={fare} rank={i + 1} />
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── AI Top Picks ────────────────────────────────────────────────────────────────

function AiTopPicks({ fares, routes }: { fares: Root["fares"]; routes: Root["routes"] }) {
    const navigate = useNavigate();

    // Build a lookup: mode → route_number → Route object
    const routeLookup: Record<string, Record<number, Route>> = {};
    routes.transit_options.forEach((opt) => {
        if (!opt.available) return;
        opt.routes.forEach((r) => {
            if (!routeLookup[opt.mode]) routeLookup[opt.mode] = {};
            routeLookup[opt.mode][r.route_number] = r;
        });
    });

    const buildAdaptedRoute = (fare: Root["fares"]["best_value"], label: "fastest" | "cheapest" | "safest") => {
        const rawRoute = routeLookup[fare.mode]?.[fare.route_number];
        const adaptedSteps = rawRoute
            ? rawRoute.steps.map((s) => {
                let type = "walk";
                const m = s.travel_mode.toUpperCase();
                if (m === "TRANSIT") {
                    const vt = (s.transit_info?.vehicle_type || "").toLowerCase();
                    type = vt.includes("metro") || vt.includes("subway") ? "metro" : "bus";
                } else if (m === "DRIVING") type = "auto";
                return { type, duration: s.duration, description: s.instruction };
            })
            : [];

        return {
            type: label,
            duration: rawRoute?.total_duration ?? `${fare.duration_minutes} min`,
            distance: rawRoute?.total_distance ?? `${fare.distance_km} km`,
            price: fare.estimated_fare_inr,
            calories: 0,
            co2: 0,
            safetyScore: 90,
            steps: adaptedSteps,
            chatbotRoute: rawRoute,
        };
    };

    const handleNavigate = (fare: Root["fares"]["best_value"], label: "fastest" | "cheapest" | "safest") => {
        const adaptedRoute = buildAdaptedRoute(fare, label);
        navigate("/route-details", {
            state: {
                route: adaptedRoute,
                originStr: fare.origin,
                destStr: fare.destination,
                originCoords: null,
                destCoords: null,
            },
        });
    };

    // Pick best_value + fastest (skip if same mode+route)
    const picks: Array<{ fare: Root["fares"]["best_value"]; label: "fastest" | "cheapest" | "safest"; accent: string; badge: string; emoji: string }> = [
        {
            fare: fares.best_value,
            label: "safest",
            accent: "from-indigo-500/15 via-purple-500/10 to-transparent border-indigo-200 dark:border-indigo-700/50",
            badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
            emoji: "🤖",
        },
    ];

    // Add fastest only if it's a different route from best_value
    if (
        fares.fastest.mode !== fares.best_value.mode ||
        fares.fastest.route_number !== fares.best_value.route_number
    ) {
        picks.push({
            fare: fares.fastest,
            label: "fastest",
            accent: "from-blue-500/15 via-cyan-500/10 to-transparent border-blue-200 dark:border-blue-700/50",
            badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
            emoji: "⚡",
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="space-y-3"
        >
            {/* Section header */}
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">AI Recommended</p>
                    <p className="text-[10px] text-gray-400">SafarLink AI's top {picks.length === 1 ? "pick" : "picks"} for your journey</p>
                </div>
            </div>

            <div className={`grid gap-3 ${picks.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {picks.map(({ fare, label, accent, badge, emoji }) => (
                    <button
                        key={`${fare.mode}-${fare.route_number}`}
                        onClick={() => handleNavigate(fare, label)}
                        className={`text-left bg-gradient-to-br ${accent} border rounded-2xl p-4 hover:shadow-lg transition-all duration-300 group relative overflow-hidden`}
                    >
                        {/* Glow pill */}
                        <div className="absolute top-3 right-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badge}`}>
                                {emoji} {label === "safest" ? "Best Value" : "Fastest"}
                            </span>
                        </div>

                        {/* Mode + route */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 font-medium uppercase tracking-widest">
                            {fare.mode} · Route {fare.route_number}
                        </p>
                        <p className="text-base font-bold text-gray-900 dark:text-white mb-3 pr-24 leading-snug">
                            {fare.origin}
                            <span className="text-gray-400 font-normal"> → </span>
                            {fare.destination}
                        </p>

                        {/* KPI row */}
                        <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-semibold">{fare.duration_minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                <Ruler className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-semibold">{fare.distance_km} km</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#111439] dark:text-[#00D4FF]">
                                <IndianRupee className="w-3.5 h-3.5" />
                                <span className="font-bold text-sm">{fare.estimated_fare_inr}</span>
                            </div>
                        </div>

                        {/* Tap hint */}
                        <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                            <ChevronRight className="w-3 h-3" />
                            Tap to view full journey &amp; start
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Buddy Panel ────────────────────────────────────────────────────────────────

function BuddyPanel({ buddy }: { buddy: Root["buddy"] }) {
    const displayText =
        buddy.answer ??
        (buddy.type === "route"
            ? "Here are the best routes for your journey."
            : buddy.type === "fare"
                ? "Here's the fare comparison for your journey."
                : "Here is the information you requested.");

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 flex gap-4"
        >
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                        SafarLink AI · {buddy.type}
                    </p>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {displayText}
                </p>
            </div>
        </motion.div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function AiRoutePlanner() {
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);

    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Root | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    const handleSearch = async () => {
        const q = query.trim();
        if (!q) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await fetchChatbotRoute(q);
            setResult(data);

            // Default tab: first available mode
            const firstAvail = data.routes.transit_options.findIndex((t) => t.available);
            setActiveTab(firstAvail >= 0 ? firstAvail : 0);
        } catch {
            setError(
                "Could not connect to the AI route planner. Make sure the chatbot backend is running on port 8000."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <div
            className={`relative min-h-screen font-sans transition-colors duration-500 flex flex-col overflow-x-hidden ${isWomenOnly
                ? "bg-pink-50 dark:bg-[#831843]"
                : "bg-[#F8F8F9] dark:bg-background"
                }`}
        >
            {/* Stripe Gradient Blobs */}
            {!isWomenOnly && (
                <>
                    <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#635BFF] rounded-full blur-[140px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>
                    <div className="absolute top-[40%] left-[-10%] w-[300px] h-[300px] bg-[#00D4FF] rounded-full blur-[120px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>
                </>
            )}
            <Navbar
                isWomenOnly={isWomenOnly}
                setIsWomenOnly={setIsWomenOnly}
                isDriverMode={isDriverMode}
                setIsDriverMode={setIsDriverMode}
            />

            <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8 z-10 relative mt-4">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                            <img src="/logo.jpeg" alt="SafarLink Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#111439] dark:text-white">
                                AI Route Planner
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Ask in plain English — get real multi-modal routes instantly.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Query Input */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="bg-white/80 backdrop-blur-md dark:bg-card rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-4 flex gap-3"
                >
                    <div className="flex-1 flex items-center gap-3 bg-gray-50/50 dark:bg-black/20 rounded-xl px-4 py-2.5 border border-gray-200 dark:border-white/10 focus-within:border-[#635BFF] transition-colors">
                        <Search className="w-5 h-5 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder='e.g. "from Koregaon Park to Pune Airport"'
                            className="flex-1 bg-transparent outline-none text-base text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleSearch}
                        disabled={loading || !query.trim()}
                        className="px-6 py-2.5 rounded-xl bg-[#111439] hover:bg-[#1a1f5c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-[#111439]/20 transition-all flex items-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Bot className="w-4 h-4" />
                        )}
                        {loading ? "Planning…" : "Plan My Route"}
                    </motion.button>
                </motion.div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 text-red-700 dark:text-red-400"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </motion.div>
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-24 rounded-2xl bg-white dark:bg-card border border-gray-100 dark:border-white/5 animate-pulse"
                            />
                        ))}
                    </motion.div>
                )}

                {/* Results */}
                {result && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* ── Buddy AI Answer ── */}
                        <BuddyPanel buddy={result.buddy} />

                        {/* ── AI Top Picks ── */}
                        <AiTopPicks fares={result.fares} routes={result.routes} />

                        {/* ── Fare Comparison ── */}
                        <FaresPanel fares={result.fares} />

                        {/* ── Routes ── */}
                        <div className="space-y-4">
                            {/* Journey summary */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="truncate">{result.routes.origin}</span>
                                <ArrowRight className="w-4 h-4 shrink-0" />
                                <MapPin className="w-4 h-4 text-[#635BFF] shrink-0" />
                                <span className="truncate">{result.routes.destination}</span>
                            </div>

                            {/* Mode Tabs */}
                            <div className="flex gap-2 flex-wrap">
                                {result.routes.transit_options.map((opt, idx) => {
                                    const meta = getMeta(opt.mode);
                                    const isActive = idx === activeTab;
                                    return (
                                        <button
                                            key={opt.mode}
                                            onClick={() => opt.available && setActiveTab(idx)}
                                            disabled={!opt.available}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${!opt.available
                                                ? "opacity-35 cursor-not-allowed bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-white/5"
                                                : isActive
                                                    ? meta.activeBg
                                                    : `${meta.bg} ${meta.color} hover:opacity-80`
                                                }`}
                                        >
                                            {meta.icon}
                                            {opt.mode}
                                            {opt.available && (
                                                <span
                                                    className={`ml-1 text-[10px] font-bold ${isActive ? "opacity-80" : "opacity-60"
                                                        }`}
                                                >
                                                    {opt.routes.length}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Routes for active tab */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    <TransitPanel option={result.routes.transit_options[activeTab]} />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* Empty state */}
                {!result && !loading && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center justify-center py-20 text-center opacity-50 space-y-3"
                    >
                        <Bot className="w-14 h-14 text-gray-300" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                            Type a travel query above and hit <strong>Plan My Route</strong> to
                            get AI-powered multi-modal routes.
                        </p>
                    </motion.div>
                )}
            </main>

            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-indigo-500/5 dark:bg-indigo-500/10" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-[#00D4FF]/5 dark:bg-[#00D4FF]/10" />
            </div>
        </div>
    );
}
