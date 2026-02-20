import { CheckCircle2, Circle, Clock, ShieldCheck } from "lucide-react";

interface Step {
    id: string;
    label: string;
    status: 'completed' | 'current' | 'pending';
}

const steps: Step[] = [
    { id: '1', label: 'Identity Verification', status: 'completed' },
    { id: '2', label: 'Vehicle Inspection', status: 'completed' },
    { id: '3', label: 'Background Check', status: 'current' },
    { id: '4', label: 'Training Module', status: 'pending' },
];

export default function VerificationStatusStepper() {
    return (
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        Verification Status
                    </h3>
                    <p className="text-sm text-gray-500">Complete all steps to start earning.</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">75%</span>
                </div>
            </div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-white/10 -z-10"></div>

                <div className="space-y-6">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${step.status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' :
                                    step.status === 'current' ? 'bg-blue-50 border-blue-500 text-blue-600 animate-pulse' :
                                        'bg-gray-50 border-gray-200 text-gray-300'
                                }`}>
                                {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                    step.status === 'current' ? <Clock className="w-5 h-5" /> :
                                        <Circle className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className={`font-medium ${step.status === 'completed' ? 'text-gray-900 dark:text-white' :
                                        step.status === 'current' ? 'text-blue-600 dark:text-blue-400 font-bold' :
                                            'text-gray-400'
                                    }`}>{step.label}</p>
                                {step.status === 'current' && (
                                    <p className="text-xs text-blue-500 mt-1">
                                        In progress... usually takes 24-48 hours.
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
