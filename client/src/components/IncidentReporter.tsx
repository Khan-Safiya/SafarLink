import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, CheckCircle2, Send } from "lucide-react";

export type IncidentType =
    | "road_blocked"
    | "accident"
    | "waterlogging"
    | "police_naka"
    | "oil_spill"
    | "other";

export interface Incident {
    id: string;
    lat: number;
    lng: number;
    type: IncidentType;
    description: string;
    routeId: string;
    reportedBy: string;
    severity: "low" | "medium" | "high";
    createdAt: string;
}

const INCIDENT_TYPES: { key: IncidentType; label: string; emoji: string }[] = [
    { key: "road_blocked", label: "Road Blocked", emoji: "🚧" },
    { key: "accident", label: "Accident", emoji: "💥" },
    { key: "waterlogging", label: "Waterlogging", emoji: "🌊" },
    { key: "police_naka", label: "Police Naka", emoji: "🚔" },
    { key: "oil_spill", label: "Oil Spill", emoji: "🛢️" },
    { key: "other", label: "Other", emoji: "⚠️" },
];

interface Props {
    routeId: string;
    userLat: number;
    userLng: number;
    onReport: (incident: Incident) => void;
}

export default function IncidentReporter({ routeId, userLat, userLng, onReport }: Props) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<IncidentType | null>(null);
    const [description, setDescription] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!selected) return;

        const incident: Incident = {
            id: crypto.randomUUID(),
            lat: userLat,
            lng: userLng,
            type: selected,
            description,
            routeId,
            reportedBy: "user",
            severity: "medium",
            createdAt: new Date().toISOString(),
        };

        // POST to backend
        try {
            await fetch("http://localhost:5000/api/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(incident),
            });
        } catch { /* best-effort */ }

        onReport(incident);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setOpen(false);
            setSelected(null);
            setDescription("");
        }, 2000);
    };

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-orange-500/20"
            >
                <AlertTriangle className="w-4 h-4" />
                Report Incident
            </button>

            {/* Modal */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] bg-black/50 flex items-end sm:items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            className="bg-white dark:bg-[#1a1a2e] rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
                        >
                            {submitted ? (
                                <div className="flex flex-col items-center gap-3 py-6">
                                    <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                                    <p className="font-bold text-gray-900 dark:text-white text-lg">Reported!</p>
                                    <p className="text-sm text-gray-500 text-center">
                                        All users on this route have been alerted.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                                            <p className="font-bold text-gray-900 dark:text-white">Report Incident</p>
                                        </div>
                                        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-400">
                                        Select the type of issue ahead. All users on this route will be alerted instantly.
                                    </p>

                                    {/* Type grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {INCIDENT_TYPES.map(({ key, label, emoji }) => (
                                            <button
                                                key={key}
                                                onClick={() => setSelected(key)}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border text-xs font-semibold transition-all ${selected === key
                                                    ? "bg-orange-500 border-orange-500 text-white"
                                                    : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-orange-300"
                                                    }`}
                                            >
                                                <span className="text-2xl">{emoji}</span>
                                                <span className="text-center leading-tight">{label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Optional description */}
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a note (optional)..."
                                        className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 dark:text-white placeholder-gray-400"
                                    />

                                    <button
                                        onClick={handleSubmit}
                                        disabled={!selected}
                                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                        Alert All Users on This Route
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
