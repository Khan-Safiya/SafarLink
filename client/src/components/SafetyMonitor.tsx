import { ShieldCheck, AlertTriangle } from "lucide-react";

interface SafetyMonitorProps {
    status: 'safe' | 'deviated' | 'stopped';
    lastUpdated: string;
}

export default function SafetyMonitor({ status, lastUpdated }: SafetyMonitorProps) {
    return (
        <div className={`rounded-xl p-4 border ${status === 'safe' ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' :
            status === 'deviated' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' :
                'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800'
            }`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${status === 'safe' ? 'bg-green-100 text-green-600' :
                    status === 'deviated' ? 'bg-amber-100 text-amber-600' :
                        'bg-red-100 text-red-600'
                    }`}>
                    {status === 'safe' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                    <h4 className={`font-bold ${status === 'safe' ? 'text-green-800 dark:text-green-200' :
                        status === 'deviated' ? 'text-amber-800 dark:text-amber-200' :
                            'text-red-800 dark:text-red-200'
                        }`}>
                        {status === 'safe' ? 'Safety Monitor Active' :
                            status === 'deviated' ? 'Route Deviation Detected' :
                                'Unexpected Stop Detected'}
                    </h4>
                    <p className={`text-sm mt-1 ${status === 'safe' ? 'text-green-700/80 dark:text-green-300/80' :
                        status === 'deviated' ? 'text-amber-700/80 dark:text-amber-300/80' :
                            'text-red-700/80 dark:text-red-300/80'
                        }`}>
                        {status === 'safe' ? 'We are monitoring your ride in real-time. No anomalies detected.' :
                            status === 'deviated' ? 'You are 500m off the suggested route. Are you okay?' :
                                'Vehicle has been stationary for 3 minutes in a non-traffic zone.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Last updated: {lastUpdated}</p>
                </div>
            </div>

            {status !== 'safe' && (
                <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm">I'm Safe</button>
                    <button className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg text-sm animate-pulse">SOS</button>
                </div>
            )}
        </div>
    );
}
