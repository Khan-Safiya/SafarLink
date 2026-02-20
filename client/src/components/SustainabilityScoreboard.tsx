import { Leaf, Trees } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface SustainabilityScoreboardProps {
    co2Saved: number; // in kg
}

export default function SustainabilityScoreboard({ co2Saved }: SustainabilityScoreboardProps) {
    // 1 Tree absorbs ~25kg CO2 per year. Let's say 1 trip saves 0.5kg.
    // We can show "Trees Planted Equivalent"
    const treesPlanted = (co2Saved / 10).toFixed(2); // Simplified conversion

    // Progress to next "badge"
    const progress = Math.min((co2Saved / 50) * 100, 100);

    return (
        <div className="bg-[#2FCE65]/10 dark:bg-[#2FCE65]/5 border border-[#2FCE65]/20 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute -right-10 -bottom-10 opacity-10">
                <Trees className="w-40 h-40 text-[#2FCE65]" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2FCE65] rounded-lg text-white">
                        <Leaf className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#07503E] dark:text-white">Eco-Impact Scoreboard</h3>
                        <p className="text-xs text-[#07503E]/60 dark:text-white/60">Your contribution to a greener planet</p>
                    </div>
                </div>
                <Badge variant="outline" className="border-[#2FCE65] text-[#2FCE65] bg-white dark:bg-black/50">
                    Level 1: Seedling
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div>
                    <p className="text-2xl font-bold text-[#07503E] dark:text-white">{co2Saved} kg</p>
                    <p className="text-xs text-[#07503E]/60 dark:text-white/60">CO₂ Emissions Prevented</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-[#07503E] dark:text-white">≈ {treesPlanted}</p>
                    <p className="text-xs text-[#07503E]/60 dark:text-white/60">Trees Planted Equivalent</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10">
                <div className="flex justify-between text-xs mb-1 font-medium text-[#07503E]/70 dark:text-white/70">
                    <span>Next Badge: Sapling</span>
                    <span>{co2Saved} / 50 kg</span>
                </div>
                <div className="h-2 w-full bg-[#07503E]/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#2FCE65] to-emerald-600"
                    />
                </div>
            </div>
        </div>
    );
}
