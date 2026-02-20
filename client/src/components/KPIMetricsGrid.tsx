import { Clock, Wallet, Leaf, ShieldAlert } from "lucide-react";

interface KPIMetricsGridProps {
    duration: string;
    distance: string;
    price: number;
    calories: number;
    safetyScore: number;
    co2: number;
}

export default function KPIMetricsGrid({ duration, distance, price, calories, safetyScore, co2 }: KPIMetricsGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Time</span>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{duration}</p>
                <p className="text-[10px] text-gray-400">{distance}</p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400">
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Cost</span>
                </div>
                <p className="font-bold text-emerald-900 dark:text-emerald-100">₹{price}</p>
                <p className="text-[10px] text-emerald-700/60 dark:text-emerald-300/60">Save ₹12</p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
                    <Leaf className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Impact</span>
                </div>
                <p className="font-bold text-blue-900 dark:text-blue-100">{co2}g CO₂</p>
                <p className="text-[10px] text-blue-700/60 dark:text-blue-300/60">{calories} kcal burn</p>
            </div>

            <div className={`p-3 rounded-xl border ${safetyScore > 80 ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100'}`}>
                <div className={`flex items-center gap-2 mb-1 ${safetyScore > 80 ? 'text-green-600 dark:text-green-400' : 'text-amber-600'}`}>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Safety</span>
                </div>
                <p className={`font-bold ${safetyScore > 80 ? 'text-green-900 dark:text-green-100' : 'text-amber-900'}`}>{safetyScore}%</p>
                <p className={`text-[10px] ${safetyScore > 80 ? 'text-green-700/60 dark:text-green-300/60' : 'text-amber-700/60'}`}>Community Rated</p>
            </div>
        </div>
    );
}
