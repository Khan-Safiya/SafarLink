import { useState } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X } from 'lucide-react';

export default function SOSButton() {
    const [isOpen, setIsOpen] = useState(false);

    const handleCall = (phoneNumber: string) => {
        // Place the call in real life
        window.location.href = `tel:${phoneNumber}`;
        setIsOpen(false);
    };

    return (
        <div className="fixed top-28 right-6 z-[100] flex flex-col-reverse items-end gap-4">
            {/* SOS Menu Panel */}
            {isOpen && (
                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/40 w-64 animate-in slide-in-from-top-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            EMERGENCY
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100/50 p-1 rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleCall('100')}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between transition-colors shadow-lg shadow-red-600/20"
                        >
                            <span>Call Police</span>
                            <PhoneCall className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => handleCall('+917385875052')}
                            className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-black text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between transition-colors"
                        >
                            <div className="text-left">
                                <span className="block">Emergency Contact</span>
                                <span className="text-xs text-gray-400">+91 73858 75052</span>
                            </div>
                            <PhoneCall className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`rounded-full w-16 h-16 flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-gray-800 rotate-12 scale-110' : 'bg-red-600 animate-pulse'}`}
            >
                {isOpen ? <X className="text-white w-8 h-8" /> : <AlertTriangle className="text-white w-8 h-8" />}
            </button>
        </div>
    );
}
