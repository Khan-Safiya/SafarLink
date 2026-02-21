import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    MapPin, ArrowRight, Phone, Star, Users, IndianRupee, Clock,
    Ruler, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft, Car,
    X, Navigation,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useSocket } from "../context/SocketContext";
import { useUser } from "@clerk/clerk-react";

const SERVER = "http://localhost:5000";

interface Passenger { userId: string; userName: string; bookedAt: string; }
interface SharedAuto {
    _id: string;
    driverName: string;
    driverPhone: string;
    vehicleNumber: string;
    rating: number;
    from: string;
    to: string;
    farePerSeat: number;
    estimatedMinutes: number;
    distanceKm: number;
    totalSeats: number;
    availableSeats: number;
    passengers: Passenger[];
    status: "waiting" | "full" | "departed" | "completed";
    departsAt: string | null;
}

const STATUS_META: Record<SharedAuto["status"], { label: string; color: string }> = {
    waiting: { label: "Waiting for passengers", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" },
    full: { label: "Full — departing soon", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
    departed: { label: "Departed", color: "text-gray-500 bg-gray-100 dark:bg-white/5" },
    completed: { label: "Completed", color: "text-gray-500 bg-gray-100 dark:bg-white/5" },
};

function SeatDots({ total, available }: { total: number; available: number }) {
    const booked = total - available;
    return (
        <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={false}
                    animate={{ scale: [1, 1.2, 1], backgroundColor: i < booked ? "#EF4444" : "#22C55E" }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-card shadow-sm"
                    style={{ backgroundColor: i < booked ? "#EF4444" : "#22C55E" }}
                    title={i < booked ? "Booked" : "Available"}
                />
            ))}
        </div>
    );
}

export default function SharedAutoPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { socket } = useSocket();

    const [autos, setAutos] = useState<SharedAuto[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [searchFrom, setSearchFrom] = useState("Bibwewadi");
    const [searchTo, setSearchTo] = useState("Swargate");

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch autos ───────────────────────────────────────────────────────────
    const fetchAutos = useCallback(async () => {
        setLoading(true);
        try {
            const url = `${SERVER}/api/shared-autos/v2/available?from=${encodeURIComponent(searchFrom)}&to=${encodeURIComponent(searchTo)}`;
            const res = await fetch(url);
            const data = await res.json();
            setAutos(Array.isArray(data) ? data : []);
        } catch {
            showToast("Could not reach server", false);
        } finally {
            setLoading(false);
        }
    }, [searchFrom, searchTo]);

    useEffect(() => { fetchAutos(); }, [fetchAutos]);

    // ── Socket: join rooms for each auto, listen for seat changes ────────────
    useEffect(() => {
        if (!socket || autos.length === 0) return;
        autos.forEach(a => socket.emit("join_auto_room", a._id));

        const handleSeatsChanged = (data: { autoId: string; availableSeats: number; status: string; passengers: Passenger[] }) => {
            setAutos(prev => prev.map(a =>
                a._id === data.autoId
                    ? { ...a, availableSeats: data.availableSeats, status: data.status as SharedAuto["status"], passengers: data.passengers }
                    : a
            ));
        };
        const handleDeparted = ({ autoId }: { autoId: string }) => {
            setAutos(prev => prev.map(a => a._id === autoId ? { ...a, status: "departed" } : a));
        };

        socket.on("auto_seats_changed", handleSeatsChanged);
        socket.on("auto_has_departed", handleDeparted);
        return () => {
            autos.forEach(a => socket.emit("leave_auto_room", a._id));
            socket.off("auto_seats_changed", handleSeatsChanged);
            socket.off("auto_has_departed", handleDeparted);
        };
    }, [socket, autos.map(a => a._id).join(",")]);

    // ── Book ──────────────────────────────────────────────────────────────────
    const handleBook = async (autoId: string) => {
        if (!user) return showToast("Please sign in to book", false);
        setActionLoading(autoId + "-book");
        try {
            const res = await fetch(`${SERVER}/api/shared-autos/v2/${autoId}/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, userName: user.fullName ?? user.firstName ?? "Passenger" }),
            });
            const data = await res.json();
            if (!res.ok) return showToast(data.error ?? "Booking failed", false);

            // Update local state immediately
            setAutos(prev => prev.map(a => a._id === autoId ? { ...a, ...data } : a));

            // Broadcast to other users via socket
            socket?.emit("auto_seat_update", { autoId, availableSeats: data.availableSeats, status: data.status, passengers: data.passengers });

            showToast(`🎉 Seat booked! ₹${data.farePerSeat} — Ramesh will pick you up shortly.`);
        } catch {
            showToast("Network error", false);
        } finally {
            setActionLoading(null);
        }
    };

    // ── Cancel ────────────────────────────────────────────────────────────────
    const handleCancel = async (autoId: string) => {
        if (!user) return;
        setActionLoading(autoId + "-cancel");
        try {
            const res = await fetch(`${SERVER}/api/shared-autos/v2/${autoId}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (!res.ok) return showToast(data.error ?? "Cancel failed", false);

            setAutos(prev => prev.map(a => a._id === autoId ? { ...a, ...data } : a));
            socket?.emit("auto_seat_update", { autoId, availableSeats: data.availableSeats, status: data.status, passengers: data.passengers });

            showToast("Booking cancelled. Seat released.");
        } catch {
            showToast("Network error", false);
        } finally {
            setActionLoading(null);
        }
    };

    // ── Reset (demo helper) ───────────────────────────────────────────────────
    const handleReset = async () => {
        await fetch(`${SERVER}/api/shared-autos/v2/reset-ramesh`, { method: "POST" });
        fetchAutos();
        showToast("Ramesh's auto reset for demo!");
    };

    const isBooked = (auto: SharedAuto) => !!user && auto.passengers.some(p => p.userId === user.id);

    return (
        <div className="min-h-screen bg-[#F4FDF7] dark:bg-background font-sans">
            <Navbar isWomenOnly={false} setIsWomenOnly={() => { }} isDriverMode={false} setIsDriverMode={() => { }} />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
                        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold max-w-sm text-center ${toast.ok ? "bg-[#07503E]" : "bg-red-600"}`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

                {/* Back */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#07503E]">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl">🛺</span>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Auto</h1>
                    </div>
                    <p className="text-sm text-gray-500">Split fare with co-passengers · Real-time seat availability</p>
                </div>

                {/* Search bar */}
                <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-white/10 p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
                    <div className="flex items-center gap-2 flex-1">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <input
                            value={searchFrom}
                            onChange={e => setSearchFrom(e.target.value)}
                            placeholder="From"
                            className="flex-1 bg-transparent text-sm font-medium outline-none text-gray-800 dark:text-white placeholder-gray-400"
                        />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex items-center gap-2 flex-1">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        <input
                            value={searchTo}
                            onChange={e => setSearchTo(e.target.value)}
                            placeholder="To"
                            className="flex-1 bg-transparent text-sm font-medium outline-none text-gray-800 dark:text-white placeholder-gray-400"
                        />
                    </div>
                    <button
                        onClick={fetchAutos}
                        className="bg-[#07503E] hover:bg-[#064031] text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Search
                    </button>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-10 h-10 border-4 border-[#07503E] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : autos.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                        <span className="text-5xl">🛺</span>
                        <p className="font-bold text-gray-700 dark:text-white">No shared autos on this route</p>
                        <p className="text-sm text-gray-400">Try "Bibwewadi → Swargate"</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {autos.map(auto => {
                            const booked = isBooked(auto);
                            const departed = auto.status === "departed";
                            const full = auto.status === "full" && !booked;
                            const meta = STATUS_META[auto.status];

                            return (
                                <motion.div
                                    key={auto._id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white dark:bg-card rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${booked ? "border-emerald-400 dark:border-emerald-600" : "border-gray-100 dark:border-white/10"}`}
                                >
                                    {/* Status ribbon */}
                                    <div className={`px-5 py-2 flex items-center justify-between text-xs font-bold ${meta.color}`}>
                                        <span className="uppercase tracking-wider">{meta.label}</span>
                                        {booked && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Your seat reserved</span>}
                                    </div>

                                    <div className="p-5 space-y-5">
                                        {/* Driver card */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-sm">
                                                🧑‍✈️
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{auto.driverName}</p>
                                                <p className="text-sm text-gray-500">{auto.vehicleNumber} · Auto Rickshaw</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs">
                                                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                                                        <Star className="w-3 h-3 fill-amber-400" />{auto.rating}
                                                    </span>
                                                    <a href={`tel:${auto.driverPhone}`} className="flex items-center gap-1 text-blue-500 hover:underline">
                                                        <Phone className="w-3 h-3" />{auto.driverPhone}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Route */}
                                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 flex items-center gap-3 text-sm">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                <div className="w-0.5 h-6 bg-gray-300 dark:bg-white/20" />
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{auto.from}</p>
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-3">{auto.to}</p>
                                            </div>
                                            <div className="text-right text-xs text-gray-500 space-y-1">
                                                <div className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{auto.estimatedMinutes} min</div>
                                                <div className="flex items-center gap-1 justify-end"><Ruler className="w-3 h-3" />{auto.distanceKm} km</div>
                                            </div>
                                        </div>

                                        {/* Seats + fare */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1.5">Seat availability</p>
                                                <SeatDots total={auto.totalSeats} available={auto.availableSeats} />
                                                <p className="text-xs text-gray-400 mt-1">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{auto.availableSeats}</span> of {auto.totalSeats} seats free
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Fare per seat</p>
                                                <p className="text-3xl font-bold text-[#07503E] dark:text-emerald-400 flex items-center justify-end">
                                                    <IndianRupee className="w-6 h-6" />{auto.farePerSeat}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Passengers list */}
                                        {auto.passengers.length > 0 && (
                                            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3">
                                                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">Co-passengers</p>
                                                <div className="space-y-1.5">
                                                    {auto.passengers.map((p, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                                {p.userName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium text-gray-700 dark:text-gray-200">{p.userName}</span>
                                                            {p.userId === user?.id && <span className="text-xs text-emerald-500 font-semibold">(You)</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            {!departed && (
                                                booked ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleCancel(auto._id)}
                                                            disabled={!!actionLoading}
                                                            className="flex-1 border border-red-200 dark:border-red-800/40 text-red-500 font-semibold py-2.5 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            {actionLoading === auto._id + "-cancel" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                            Cancel Booking
                                                        </button>
                                                        <button
                                                            onClick={() => navigate("/tracking", { state: { originStr: auto.from, destStr: auto.to } })}
                                                            className="flex items-center gap-2 bg-[#07503E] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#064031] transition-colors"
                                                        >
                                                            <Navigation className="w-4 h-4" /> Track
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBook(auto._id)}
                                                        disabled={!!actionLoading || full || auto.availableSeats === 0}
                                                        className="w-full bg-[#07503E] hover:bg-[#064031] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {actionLoading === auto._id + "-book" ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Car className="w-4 h-4" />
                                                        )}
                                                        {full ? "Auto Full" : `Book Seat · ₹${auto.farePerSeat}`}
                                                    </button>
                                                )
                                            )}
                                            {departed && (
                                                <div className="w-full text-center py-3 text-gray-400 text-sm font-semibold">
                                                    🚗 Auto has departed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Demo reset button */}
                <div className="text-center pt-4">
                    <button
                        onClick={handleReset}
                        className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl transition-colors"
                    >
                        🔄 Reset Ramesh's Auto (Demo)
                    </button>
                </div>
            </main>
        </div>
    );
}
