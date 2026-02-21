import type { LucideIcon } from "lucide-react";
import { Footprints, TrainFront, CarFront, BusFront, Bike } from "lucide-react";

interface Step {
    type: 'walk' | 'metro' | 'bus' | 'auto' | 'bike';
    duration: string;
    description: string;
    color?: string;
}

interface JourneyTimelineProps {
    steps: Step[];
}

const iconMap: Record<string, LucideIcon> = {
    walk: Footprints,
    metro: TrainFront,
    bus: BusFront,
    auto: CarFront,
    bike: Bike
};

const colorMap: Record<string, string> = {
    walk: "bg-gray-400",
    metro: "bg-purple-500", // Pune Metro Purple Line
    bus: "bg-red-500",
    auto: "bg-yellow-500",
    bike: "bg-blue-500"
};

export default function JourneyTimeline({ steps }: JourneyTimelineProps) {
    return (
        <div className="relative pl-4 pt-2">
            {/* Connecting Line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

            <div className="space-y-6">
                {steps.map((step, idx) => {
                    const Icon = iconMap[step.type] || Footprints;
                    const bgColor = colorMap[step.type] || "bg-gray-400";

                    return (
                        <div key={idx} className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${bgColor} ring-4 ring-white dark:ring-[#111439]`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="pt-1">
                                <p className="font-bold text-sm text-gray-900 dark:text-white capitalize">{step.type}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{step.description} • {step.duration}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
