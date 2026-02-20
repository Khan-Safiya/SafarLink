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
        const props = {
            className: `w-5 h-5 ${completed ? 'text-green-500' : active ? 'text-[#2FCE65] animate-pulse' : 'text-gray-400'}`
        };

        switch (type.toLowerCase()) {
            case 'walk': return <PersonStanding {...props} />;
            case 'bus': return <Bus {...props} />;
            case 'metro': return <Train {...props} />;
            case 'auto': return <Car {...props} />;
            default: return <Navigation {...props} />;
        }
    };

    return (
        <Card className="border-2 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#2FCE65] to-emerald-300"></div>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2FCE65]" />
                    Journey Progress
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
                {/* Connecting Line */}
                <div className="absolute left-[31px] top-6 bottom-8 w-0.5 bg-gray-100 dark:bg-white/10 z-0"></div>

                {steps.map((step, idx) => {
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                        <div key={idx} className={`relative z-10 flex gap-4 p-3 rounded-lg transition-colors ${isActive ? 'bg-[#2FCE65]/5 border border-[#2FCE65]/20' : ''}`}>
                            <div className="mt-0.5 bg-white dark:bg-card">
                                {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6 text-[#2FCE65] fill-green-50" />
                                ) : isActive ? (
                                    <div className="w-6 h-6 rounded-full border-2 border-[#2FCE65] flex items-center justify-center bg-white dark:bg-card shadow-sm">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#2FCE65] animate-pulse"></div>
                                    </div>
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                )}
                            </div>
                            <div className={`flex-1 ${isCompleted ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {getIcon(step.type, isActive, isCompleted)}
                                    <p className={`font-bold text-sm ${isActive ? 'text-[#07503E] dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {step.description}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 ml-7">{step.duration}</p>
                            </div>
                        </div>
                    );
                })}

                {currentStepIndex >= steps.length && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900 flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold">
                        🎉 You have arrived!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
