import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, PersonStanding, Bus, Train, Car, Navigation } from "lucide-react";

interface Step {
    type: string;
    description: string;
    duration: string;
}

interface JourneyChecklistProps {
    steps: Step[];
    currentStepIndex: number;
}

export default function JourneyChecklist({ steps, currentStepIndex }: JourneyChecklistProps) {
    const getIcon = (type: string, active: boolean, completed: boolean) => {
        const base = "w-5 h-5 transition-colors duration-300";
        const color = completed
            ? "text-[#111439] dark:text-white"
            : active
                ? "text-white"
                : "text-gray-400";

        const props = { className: `${base} ${color}` };

        switch (type.toLowerCase()) {
            case 'walk': return <PersonStanding {...props} />;
            case 'bus': return <Bus {...props} />;
            case 'metro': return <Train {...props} />;
            case 'auto': return <Car {...props} />;
            default: return <Navigation {...props} />;
        }
    };

    return (
        <Card className="border border-indigo-100/50 dark:border-white/10 shadow-xl shadow-blue-900/5 bg-white/95 dark:bg-[#0f1a14]/90 backdrop-blur-md relative overflow-hidden rounded-2xl">
            {/* Background effects */}
            <div className="absolute top-0 right-[-10%] w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[150px] h-[150px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <CardHeader className="pb-4 border-b border-gray-100/80 dark:border-white/5 relative z-10">
                <CardTitle className="text-base font-bold text-[#111439] dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-700">
                            <Navigation className="w-4 h-4 text-[#635BFF]" />
                        </div>
                        Track Progress
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-cyan-900/30 text-[#635BFF] dark:text-cyan-400 px-3 py-1.5 rounded-full border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm">
                        Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 relative z-10">
                {/* Connecting Line with Gradient */}
                <div className="absolute left-[41px] top-[40px] bottom-[40px] w-[3px] bg-gradient-to-b from-[#635BFF] via-[#00D4FF] to-gray-200 dark:to-gray-800 rounded-full opacity-40 z-0"></div>

                <div className="space-y-6">
                    {steps.map((step, idx) => {
                        const isCompleted = idx < currentStepIndex;
                        const isActive = idx === currentStepIndex;

                        return (
                            <div key={idx} className={`relative z-10 flex gap-5 group transition-all duration-500 ${isActive ? 'scale-[1.02] transform origin-left' : ''}`}>

                                {/* Timeline Node */}
                                <div className="mt-1 relative flex flex-col items-center">
                                    {isCompleted ? (
                                        <div className="w-8 h-8 rounded-full bg-[#111439] dark:bg-white flex items-center justify-center shadow-md shadow-[#111439]/20 transition-all duration-300 outline outline-2 outline-offset-2 outline-gray-100 dark:outline-gray-800">
                                            <CheckCircle2 className="w-5 h-5 text-white dark:text-[#111439]" />
                                        </div>
                                    ) : isActive ? (
                                        <div className="relative flex items-center justify-center mt-1">
                                            <div className="absolute w-8 h-8 bg-[#00D4FF] rounded-full animate-ping opacity-30"></div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#635BFF] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-cyan-500/40 ring-4 ring-white dark:ring-[#0f1a14] z-10 outline outline-2 outline-cyan-200 dark:outline-cyan-900">
                                                <Navigation className="w-3.5 h-3.5 text-white animate-bounce [animation-duration:2s]" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0f1a14] border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm group-hover:border-indigo-300 transition-colors">
                                            <Circle className="w-2.5 h-2.5 text-gray-200 dark:text-gray-700 fill-current" />
                                        </div>
                                    )}
                                </div>

                                {/* Content Card */}
                                <div className={`flex-1 p-4 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'bg-gradient-to-r from-indigo-50/80 to-blue-50/50 dark:from-indigo-900/20 dark:to-cyan-900/10 border border-indigo-100 dark:border-indigo-800/30 shadow-[0_4px_20px_-4px_rgba(99,91,255,0.15)]'
                                    : isCompleted
                                        ? 'bg-gray-50/50 dark:bg-white/5 opacity-70 border border-transparent'
                                        : 'bg-white/40 dark:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:shadow-sm'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-[10px] ${isActive
                                            ? 'bg-[#635BFF] shadow-md shadow-indigo-500/20'
                                            : isCompleted
                                                ? 'bg-gray-200 dark:bg-gray-700'
                                                : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                                            }`}>
                                            {getIcon(step.type, isActive, isCompleted)}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm tracking-tight ${isActive ? 'text-[#635BFF] dark:text-cyan-400'
                                                : isCompleted ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-300'
                                                    : 'text-[#111439] dark:text-gray-200'
                                                }`}>
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-[50px]">
                                        <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${isActive ? 'bg-indigo-100/50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                            }`}>
                                            ⏱ {step.duration}
                                        </div>
                                        {isActive && (
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">In Progress</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {currentStepIndex >= steps.length && (
                    <div className="mt-6 p-5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center gap-2 text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                        <CheckCircle2 className="w-10 h-10 drop-shadow-md" />
                        <p className="font-bold text-lg tracking-tight drop-shadow-sm">You have arrived safely!</p>
                        <p className="text-xs text-emerald-50 font-medium tracking-wide">Thank you for traveling with SafarLink</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
