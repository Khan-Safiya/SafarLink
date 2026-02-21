import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, ArrowRight, Bus, Train, Car, CheckCircle2, Clock, IndianRupee,
    Ruler, AlertTriangle, Ticket, Download, Shield, ArrowLeft, Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { bookJourney } from "../api/chatbotApi";
import type { BookingResult, BookingSegment } from "../types/booking";
import type { Root } from "../types/chatbotRoute";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingPhase = "idle" | "processing" | "done";
type AutoPhase = "idle" | "confirming" | "searching" | "found" | "timeout";

// Mock driver pool
const MOCK_DRIVERS = [
    { name: "Raju Patil", rating: 4.7, vehicle: "Bajaj RE Auto", plate: "MH 12 AB 3456", eta: 4 },
    { name: "Suresh Kumar", rating: 4.5, vehicle: "TVS King Auto", plate: "MH 14 CD 7890", eta: 6 },
    { name: "Anil Shinde", rating: 4.8, vehicle: "Piaggio Ape", plate: "MH 12 XY 2211", eta: 3 },
];

// ── E-Ticket Card (consistent with AppAssistantChat) ──────────────────────────

function ETicketCard({ result }: { result: BookingResult }) {
    const modeIcon: Record<string, string> = {
        bus: "🚌", "metro / subway": "🚇", metro: "🚇",
        "auto / cab": "🛺", auto: "🛺", driving: "🛺",
        walking: "🚶",
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#635BFF]/5 via-white to-[#00D4FF]/5 dark:from-indigo-900/20 dark:via-black/40 dark:to-[#00D4FF]/10 border-2 border-[#635BFF]/20 dark:border-[#635BFF]/40 rounded-3xl overflow-hidden"
        >
            {/* Header */}
            <div className="bg-[#111439] px-5 py-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#00D4FF]" />
                <div className="flex-1">
                    <p className="text-white font-bold">Booking Confirmed!</p>
                    <p className="text-[#00D4FF]/80 text-xs">SafarLink E-Ticket</p>
                </div>
                <div className="text-right">
                    <p className="text-white font-mono font-bold text-2xl tracking-widest">{result.pnr}</p>
                    <p className="text-[#00D4FF] text-xs">PNR</p>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Route */}
                <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{result.origin}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <MapPin className="w-4 h-4 text-[#635BFF] shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{result.destination}</span>
                </div>

                {/* Segments */}
                {result.segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/60 dark:bg-white/5 rounded-2xl px-4 py-3 border border-gray-100 dark:border-white/10">
                        <span className="text-2xl">{modeIcon[seg.mode.toLowerCase()] ?? "🚦"}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 dark:text-gray-100">{seg.line_name}</p>
                            <p className="text-sm text-gray-500">{seg.from_stop} → {seg.to_stop} · {seg.num_stops} stops</p>
                        </div>
                        <span className="font-bold text-[#111439] dark:text-[#00D4FF] flex items-center text-lg">
                            <IndianRupee className="w-4 h-4" />{seg.fare_inr.toFixed(0)}
                        </span>
                    </div>
                ))}

                {/* Payment */}
                <div className="border-t border-[#635BFF]/10 dark:border-white/10 pt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <p className="text-xs text-gray-400">Total Paid</p>
                        <p className="font-bold text-xl text-[#111439] dark:text-[#00D4FF] flex items-center">
                            <IndianRupee className="w-5 h-5" />{result.total_fare_inr.toFixed(0)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Payment ID</p>
                        <p className="font-mono text-xs text-gray-500">{result.payment_id}</p>
                        <p className="text-xs text-gray-400 mt-1">Booked at</p>
                        <p className="text-xs text-gray-500">{result.booking_time}</p>
                    </div>
                </div>

                {/* Metro QR */}
                {result.qr_data && (
                    <div className="bg-white dark:bg-white/5 border border-[#635BFF]/20 dark:border-[#635BFF]/40 rounded-2xl p-4 flex flex-col items-center gap-2">
                        <p className="text-xs font-bold text-[#635BFF] dark:text-indigo-400 uppercase tracking-wider">
                            🚇 Metro QR Ticket — Scan at Entry Gate
                        </p>
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                            <img src={result.qr_data} alt={`QR ${result.pnr}`} width={160} height={160} className="rounded-lg" />
                        </div>
                        <p className="font-mono text-sm tracking-widest text-[#111439] dark:text-white">{result.pnr}</p>
                        <p className="text-xs text-[#635BFF]/80">Valid for single journey · Non-transferable</p>
                    </div>
                )}

                {/* Download */}
                <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#111439] dark:text-white border border-dashed border-gray-300 dark:border-white/20 rounded-2xl py-3 hover:bg-[#635BFF]/5 dark:hover:bg-white/10 transition-colors">
                    <Download className="w-4 h-4" />
                    Download Ticket (PDF)
                </button>
            </div>
        </motion.div>
    );
}

// ── Auto Booking Panel ─────────────────────────────────────────────────────────

function AutoBookingPanel({ fareInr }: { fareInr: number }) {
    const [phase, setPhase] = useState<AutoPhase>("idle");
    const [timeLeft, setTimeLeft] = useState(120);
    const [driver, setDriver] = useState<typeof MOCK_DRIVERS[0] | null>(null);
    const [cancelled, setCancelled] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const matchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startSearch = () => {
        setPhase("searching");
        setTimeLeft(120);

        // Countdown
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setPhase("timeout");
                    clearTimeout(matchRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Mock driver match after 8–20s
        const matchDelay = 8000 + Math.random() * 12000;
        matchRef.current = setTimeout(() => {
            if (phase === "timeout") return;
            clearInterval(timerRef.current!);
            const d = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
            setDriver(d);
            setPhase("found");
        }, matchDelay);
    };

    useEffect(() => () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (matchRef.current) clearTimeout(matchRef.current);
    }, []);

    const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const secs = String(timeLeft % 60).padStart(2, "0");
    const timerPct = (timeLeft / 120) * 100;

    return (
        <div className="space-y-4">
            {/* Idle — confirm tile */}
            {phase === "idle" && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-5 border border-amber-200 dark:border-amber-700/40 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🛺</span>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Book Auto / Rickshaw</p>
                            <p className="text-sm text-gray-500">Requesting nearby drivers in 1 km radius</p>
                        </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">Predicted Cost</p>
                        <p className="text-3xl font-bold text-[#111439] dark:text-[#00D4FF] flex items-center">
                            <IndianRupee className="w-7 h-7" />{fareInr}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Fare may vary slightly based on actual route</p>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Once accepted, ride cannot be cancelled from either end. ₹50 penalty applies on cancellation.</span>
                    </div>
                    <button
                        onClick={() => setPhase("confirming")}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                    >
                        Confirm Ride Request
                    </button>
                </motion.div>
            )}

            {/* Confirming */}
            {phase === "confirming" && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-5 border border-amber-200 dark:border-amber-700/40 space-y-4"
                >
                    <p className="font-bold text-[#111439] dark:text-white text-center">Ready to find a driver?</p>
                    <p className="text-sm text-gray-500 text-center">Drivers within 1 km of your location will be notified.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={startSearch}
                            className="bg-[#111439] hover:bg-[#1a1f5c] text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                        >
                            Yes, Find Driver
                        </button>
                        <button
                            onClick={() => setPhase("idle")}
                            className="border border-gray-200 dark:border-white/10 text-[#111439] dark:text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Searching + timer */}
            {phase === "searching" && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-6 border border-blue-200 dark:border-blue-700/40 space-y-5 text-center"
                >
                    <div className="flex justify-center">
                        <div className="relative w-24 h-24">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                                <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                <circle
                                    cx="48" cy="48" r="40" fill="none"
                                    stroke="#635BFF" strokeWidth="8"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - timerPct / 100)}`}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold font-mono text-[#635BFF]">{mins}:{secs}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-[#111439] dark:text-white">Searching for nearby drivers…</p>
                        <p className="text-sm text-gray-500">Request will expire if no driver accepts within 2 minutes</p>
                    </div>
                    <div className="flex justify-center gap-2">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2 h-2 rounded-full bg-[#635BFF] animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Driver found */}
            {phase === "found" && driver && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-5 border-2 border-[#635BFF] space-y-4 shadow-lg shadow-[#635BFF]/10"
                >
                    <div className="flex items-center gap-2 text-[#635BFF] dark:text-indigo-400">
                        <CheckCircle2 className="w-5 h-5 cursor-default" />
                        <p className="font-bold cursor-default">Driver Found!</p>
                    </div>
                    <div className="bg-[#635BFF]/5 dark:bg-[#635BFF]/10 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#111439] flex items-center justify-center text-2xl shadow-inner">
                            🛺
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[#111439] dark:text-white">{driver.name}</p>
                            <p className="text-sm text-gray-500">{driver.vehicle} · {driver.plate}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className="flex items-center gap-1 text-amber-500 font-semibold"><Star className="w-3 h-3 fill-amber-400" /> {driver.rating}</span>
                                <span className="text-gray-400">·</span>
                                <span className="text-[#635BFF] font-semibold">{driver.eta} min away</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-[#111439] dark:text-[#00D4FF] flex items-center">
                                <IndianRupee className="w-5 h-5" />{fareInr}
                            </p>
                            <p className="text-xs text-gray-400">Mock paid</p>
                        </div>
                    </div>
                    {!cancelled ? (
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 border border-red-100 dark:border-red-900/30">
                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>Ride accepted. Cancellation will incur a <strong>₹50 penalty</strong>.</span>
                            </div>
                            <button
                                onClick={() => setCancelled(true)}
                                className="w-full border-2 border-red-200 dark:border-red-800/40 text-red-500 font-bold py-2.5 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                Cancel Ride (₹50 Penalty)
                            </button>
                        </div>
                    ) : (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300 font-semibold text-center border border-red-200 dark:border-red-800/40">
                            ❌ Ride Cancelled · ₹50 penalty charged (mock)
                        </div>
                    )}
                </motion.div>
            )}

            {/* Timeout */}
            {phase === "timeout" && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-5 border border-orange-200 dark:border-orange-700/40 space-y-3 text-center"
                >
                    <span className="text-4xl">😔</span>
                    <p className="font-bold text-[#111439] dark:text-white">No Autos Available Nearby</p>
                    <p className="text-sm text-gray-500">No driver accepted within 2 minutes. Please try again in a few minutes.</p>
                    <button
                        onClick={() => { setPhase("idle"); setTimeLeft(120); }}
                        className="mt-2 bg-[#635BFF] hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md"
                    >
                        Try Again
                    </button>
                </motion.div>
            )}
        </div>
    );
}

// ── Main Booking Page ──────────────────────────────────────────────────────────

export default function BookingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as {
        routeData?: Root;
        origin?: string;
        destination?: string;
        routeType?: string;
        fareInr?: number;
        segments?: BookingSegment[];
    } | null;

    const [metroPhase, setMetroPhase] = useState<BookingPhase>("idle");
    const [busPhase, setBusPhase] = useState<BookingPhase>("idle");
    const [metroTicket, setMetroTicket] = useState<BookingResult | null>(null);
    const [busTicket, setBusTicket] = useState<BookingResult | null>(null);
    const [activeTab, setActiveTab] = useState<"metro" | "bus" | "auto">("metro");

    const origin = state?.origin ?? state?.routeData?.routes?.origin ?? "Origin";
    const destination = state?.destination ?? state?.routeData?.routes?.destination ?? "Destination";
    const routeType = state?.routeType ?? "fastest";
    const fareInr = state?.fareInr ?? state?.routeData?.fares?.cheapest?.estimated_fare_inr ?? 30;

    // Determine which modes are in this journey
    const segments: BookingSegment[] = state?.segments ?? [];
    const hasMetro = segments.some(s => s.mode.toLowerCase().includes("metro") || s.mode.toLowerCase().includes("subway"));
    const hasBus = segments.some(s => s.mode.toLowerCase() === "bus");
    const hasAuto = segments.some(s => s.mode.toLowerCase().includes("auto") || s.mode.toLowerCase().includes("cab") || s.mode.toLowerCase().includes("driving"));

    // Fallback when no segments: show all if coming from fare data
    const showMetro = hasMetro || (!hasBus && !hasAuto);
    const showBus = hasBus || (!hasMetro && !hasAuto);
    const showAuto = hasAuto;

    const bookTicket = async (
        mode: "metro" | "bus",
        setPhase: (p: BookingPhase) => void,
        setTicket: (r: BookingResult) => void
    ) => {
        setPhase("processing");
        const modeLabel = mode === "metro" ? "Metro / Subway" : "Bus";
        const fareKey = mode === "metro" ? "subway" : "bus";
        const baseFare = mode === "metro" ? 35 : 20;

        const seg: BookingSegment = {
            mode: modeLabel,
            line_name: mode === "metro" ? "Pune Metro Purple Line" : "PMPML City Bus",
            from_stop: origin,
            to_stop: destination,
            num_stops: mode === "metro" ? 5 : 8,
            fare_inr: 0,
        };

        try {
            await new Promise(res => setTimeout(res, 1800)); // mock payment delay
            const result = await bookJourney({
                origin,
                destination,
                route_type: routeType,
                transit_segments: [seg],
                passenger_name: "SafarLink User",
                estimated_fare_inr: baseFare,
            });
            setTicket(result);
            setPhase("done");
        } catch {
            setPhase("idle");
        }
    };

    return (
        <div className="relative min-h-screen bg-[#F8F8F9] dark:bg-background font-sans overflow-x-hidden">
            {/* Stripe Gradient Blobs */}
            <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#635BFF] rounded-full blur-[140px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-[#00D4FF] rounded-full blur-[120px] opacity-20 mix-blend-multiply z-0 pointer-events-none"></div>

            <Navbar isWomenOnly={false} setIsWomenOnly={() => { }} isDriverMode={false} setIsDriverMode={() => { }} />

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 relative z-10">

                {/* Back button */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#111439] dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md dark:bg-card rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#111439] dark:text-gray-100">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate">{origin}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                        <MapPin className="w-4 h-4 text-[#635BFF] shrink-0" />
                        <span className="truncate">{destination}</span>
                    </div>
                    <div className="flex gap-3 mt-3 text-xs text-gray-500">
                        <span className="capitalize bg-[#635BFF]/10 dark:bg-[#635BFF]/30 text-[#635BFF] dark:text-indigo-400 font-semibold px-3 py-1 rounded-full">
                            {routeType} route
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-[#111439] dark:text-[#00D4FF]">
                            <IndianRupee className="w-3 h-3" />
                            Est. ₹{fareInr}
                        </span>
                    </div>
                </div>

                {/* Tab selector */}
                <div className="flex gap-2 bg-white/80 backdrop-blur-md dark:bg-card rounded-2xl p-1.5 border border-gray-100 dark:border-white/10 shadow-sm">
                    {showBus && (
                        <button
                            onClick={() => setActiveTab("bus")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "bus" ? "bg-red-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                        >
                            <Bus className="w-4 h-4" /> Book Bus
                        </button>
                    )}
                    {showMetro && (
                        <button
                            onClick={() => setActiveTab("metro")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "metro" ? "bg-purple-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                        >
                            <Train className="w-4 h-4" /> Book Metro
                        </button>
                    )}
                    {showAuto && (
                        <button
                            onClick={() => setActiveTab("auto")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "auto" ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                        >
                            <Car className="w-4 h-4" /> Book Auto
                        </button>
                    )}
                    {/* Fallback: show all tabs if no segment info */}
                    {!showBus && !showMetro && !showAuto && (
                        <>
                            <button onClick={() => setActiveTab("bus")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "bus" ? "bg-red-600 text-white" : "text-gray-500"}`}><Bus className="w-4 h-4" /> Bus</button>
                            <button onClick={() => setActiveTab("metro")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "metro" ? "bg-purple-600 text-white" : "text-gray-500"}`}><Train className="w-4 h-4" /> Metro</button>
                            <button onClick={() => setActiveTab("auto")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "auto" ? "bg-amber-500 text-white" : "text-gray-500"}`}><Car className="w-4 h-4" /> Auto</button>
                        </>
                    )}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                    {/* BUS */}
                    {activeTab === "bus" && (
                        <motion.div key="bus" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                            {busPhase === "idle" && (
                                <div className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-5 border border-red-100 dark:border-red-900/30 space-y-3 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">🚌</span>
                                        <div>
                                            <p className="font-bold text-[#111439] dark:text-white">Book PMPML Bus Ticket</p>
                                            <p className="text-sm text-gray-500">Fixed fare · Valid for 1 journey</p>
                                        </div>
                                        <span className="ml-auto text-2xl font-bold text-red-600 dark:text-red-400 flex items-center">
                                            <IndianRupee className="w-5 h-5" />20
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => bookTicket("bus", setBusPhase, setBusTicket)}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Ticket className="w-4 h-4" /> Pay ₹20 & Get Ticket
                                    </button>
                                </div>
                            )}
                            {busPhase === "processing" && (
                                <div className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-8 border border-gray-100 dark:border-white/10 text-center space-y-3 shadow-sm">
                                    <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
                                    <p className="font-semibold text-[#111439] dark:text-gray-200">Processing payment…</p>
                                    <p className="text-sm text-gray-400">Booking your bus ticket</p>
                                </div>
                            )}
                            {busPhase === "done" && busTicket && <ETicketCard result={busTicket} />}
                        </motion.div>
                    )}

                    {/* METRO */}
                    {activeTab === "metro" && (
                        <motion.div key="metro" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                            {metroPhase === "idle" && (
                                <div className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-5 border border-purple-100 dark:border-purple-900/30 space-y-3 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">🚇</span>
                                        <div>
                                            <p className="font-bold text-[#111439] dark:text-white">Book Pune Metro Ticket</p>
                                            <p className="text-sm text-gray-500">QR ticket · Scan at entry gate</p>
                                        </div>
                                        <span className="ml-auto text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center">
                                            <IndianRupee className="w-5 h-5" />35
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-xl px-3 py-2">
                                        <Shield className="w-3.5 h-3.5" />
                                        A QR code will be generated for scanner at platform gates
                                    </div>
                                    <button
                                        onClick={() => bookTicket("metro", setMetroPhase, setMetroTicket)}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Ticket className="w-4 h-4" /> Pay ₹35 & Get QR Ticket
                                    </button>
                                </div>
                            )}
                            {metroPhase === "processing" && (
                                <div className="bg-white/80 backdrop-blur-sm dark:bg-card rounded-2xl p-8 border border-gray-100 dark:border-white/10 text-center space-y-3 shadow-sm">
                                    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto" />
                                    <p className="font-semibold text-[#111439] dark:text-gray-200">Processing payment…</p>
                                    <p className="text-sm text-gray-400">Generating your Metro QR ticket</p>
                                </div>
                            )}
                            {metroPhase === "done" && metroTicket && <ETicketCard result={metroTicket} />}
                        </motion.div>
                    )}

                    {/* AUTO */}
                    {activeTab === "auto" && (
                        <motion.div key="auto" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <AutoBookingPanel fareInr={Math.round(fareInr * 0.6)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
