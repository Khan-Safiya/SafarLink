import { motion, AnimatePresence } from "framer-motion";
import { CloudRain, CloudLightning, X } from "lucide-react";
import type { WeatherData } from "../hooks/useWeather";
import { useState } from "react";

interface WeatherBannerProps {
    weather: WeatherData;
    compact?: boolean;
}

export default function WeatherBanner({ weather, compact = false }: WeatherBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (!weather.is_raining || dismissed) return null;

    const isHeavy = weather.is_heavy_rain;
    const bg = isHeavy
        ? "bg-gradient-to-r from-slate-800 to-indigo-900 border-indigo-700/50"
        : "bg-gradient-to-r from-blue-900/90 to-cyan-900/80 border-blue-700/40";
    const Icon = isHeavy ? CloudLightning : CloudRain;
    const iconColor = isHeavy ? "text-yellow-300" : "text-blue-300";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className={`relative ${compact ? "rounded-xl px-4 py-3" : "rounded-2xl px-5 py-4"} border backdrop-blur-md ${bg} text-white flex items-start gap-3 shadow-lg`}
            >
                {/* Animated rain drops overlay */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none opacity-20">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-0.5 bg-blue-300 rounded-full"
                            style={{
                                height: `${6 + Math.random() * 10}px`,
                                left: `${10 + i * 11}%`,
                                top: "-10px",
                            }}
                            animate={{ y: ["0%", "120%"], opacity: [0.8, 0] }}
                            transition={{
                                duration: 0.8 + Math.random() * 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "linear",
                            }}
                        />
                    ))}
                </div>

                {/* Icon */}
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon className={compact ? "w-5 h-5" : "w-6 h-6"} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`font-bold ${compact ? "text-sm" : "text-base"}`}>
                            {isHeavy ? "⛈️ Heavy Rain Alert" : "🌧️ Rain Alert"}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-medium">
                            Pune · {weather.weather_description}
                        </span>
                        {weather.rain_probability_pct > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 font-semibold">
                                {Math.round(weather.rain_probability_pct)}% chance
                            </span>
                        )}
                    </div>
                    {weather.monsoon_advisory && (
                        <p className={`text-blue-100/90 leading-snug ${compact ? "text-xs" : "text-sm"}`}>
                            {weather.monsoon_advisory}
                        </p>
                    )}
                </div>

                {/* Dismiss */}
                <button
                    onClick={() => setDismissed(true)}
                    className="shrink-0 text-white/50 hover:text-white transition-colors mt-0.5"
                    aria-label="Dismiss weather alert"
                >
                    <X className="w-4 h-4" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
