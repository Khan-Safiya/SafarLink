import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Calendar, Clock, Car, User, Search, Phone,
    ShieldCheck, CreditCard, ChevronRight, X, Loader2, IndianRupee,
    AlertTriangle, Send
} from "lucide-react";
import Navbar from "../components/Navbar";

const SERVER = "http://localhost:5000";

interface PoolRide {
    _id: string;
    hostName: string;
    hostPhone: string;
    vehicleType: 'Bike' | 'Car' | 'Scooter';
    vehicleDetails: string;
    from: string;
    to: string;
    departureTime: string;
    totalSeats: number;
    availableSeats: number;
    farePerSeat: number;
    paymentDetails: string;
    status: string;
}

export default function VehiclePooling() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'find' | 'host'>('find');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── FIND RIDE STATE ────────────────────────────────────────────────────────
    const [rides, setRides] = useState<PoolRide[]>([]);
    const [loadingRides, setLoadingRides] = useState(false);
    const [searchFrom, setSearchFrom] = useState("");
    const [searchTo, setSearchTo] = useState("");
    const [filterType, setFilterType] = useState<"All" | "Bike" | "Car" | "Scooter">("All");

    const fetchRides = useCallback(async () => {
        setLoadingRides(true);
        try {
            const params = new URLSearchParams();
            if (searchFrom) params.append("from", searchFrom);
            if (searchTo) params.append("to", searchTo);
            if (filterType !== "All") params.append("vehicleType", filterType);
            if (isWomenOnly) params.append("womenOnly", "true");

            const res = await fetch(`${SERVER}/api/pool-rides?${params.toString()}`);
            if (res.ok) {
                setRides(await res.json());
            }
        } catch {
            showToast("Failed to fetch rides", "error");
        } finally {
            setLoadingRides(false);
        }
    }, [searchFrom, searchTo, filterType, isWomenOnly]);

    useEffect(() => {
        if (activeTab === 'find') fetchRides();
    }, [activeTab, fetchRides]);

    // ── HOST RIDE STATE ────────────────────────────────────────────────────────
    const [hostForm, setHostForm] = useState({
        from: "", to: "", departureDate: "", departureTime: "",
        vehicleType: "Scooter" as "Bike" | "Car" | "Scooter",
        vehicleDetails: "", totalSeats: "1", farePerSeat: "", paymentDetails: ""
    });
    const [postingRide, setPostingRide] = useState(false);

    const handleHostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return showToast("Please sign in to host a ride", "error");

        const dtStr = `${hostForm.departureDate}T${hostForm.departureTime}`;
        const dt = new Date(dtStr);
        const now = new Date();
        const diffH = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffH <= 0) return showToast("Departure time must be in the future", "error");
        if (diffH > 24) return showToast("You can only schedule up to 24 hours in advance", "error");

        setPostingRide(true);
        try {
            const token = await getToken();
            const res = await fetch(`${SERVER}/api/pool-rides`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    hostName: user.fullName || user.firstName,
                    // Hardcoding simulated host phone
                    hostPhone: "+917385875052",
                    ...hostForm,
                    departureTime: dt.toISOString(),
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to post ride");

            showToast("Ride posted successfully! Waiting for riders.");
            setActiveTab('find');
            setHostForm({
                from: "", to: "", departureDate: "", departureTime: "",
                vehicleType: "Scooter", vehicleDetails: "", totalSeats: "1", farePerSeat: "", paymentDetails: ""
            });
            fetchRides();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setPostingRide(false);
        }
    };

    // ── BOOKING STATE (M0DAL) ──────────────────────────────────────────────────
    const [bookingRide, setBookingRide] = useState<PoolRide | null>(null);
    const [isBooking, setIsBooking] = useState(false);

    const handleBook = async () => {
        if (!user || !bookingRide) return;
        setIsBooking(true);
        try {
            const token = await getToken();
            const res = await fetch(`${SERVER}/api/pool-rides/${bookingRide._id}/book`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    userName: user.fullName || user.firstName || "Rider",
                    userPhone: "+917058395184" // Simulated rider phone
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Booking failed");

            showToast(`Success! 10% advance (₹${data.advancePaid}) paid. Check WhatsApp for details.`);
            setBookingRide(null);
            fetchRides(); // Refresh list
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${isWomenOnly ? 'bg-pink-50 dark:bg-[#831843]' : 'bg-[#F4FDF7] dark:bg-background'}`}>
            <Navbar isWomenOnly={isWomenOnly} setIsWomenOnly={setIsWomenOnly} isDriverMode={isDriverMode} setIsDriverMode={setIsDriverMode} />

            {/* TOAST NOTIFICATION */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -50, x: "-50%" }}
                        className={`fixed top-24 left-1/2 z-[999] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-white font-medium ${toast.type === "error" ? "bg-red-600" : "bg-[#07503E]"}`}
                    >
                        {toast.type === "error" ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8 z-10 relative">

                {/* HEADER & TABS */}
                <div className="text-center space-y-6">
                    <div>
                        <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-3 ${isWomenOnly ? 'text-pink-900 dark:text-pink-100' : 'text-[#07503E] dark:text-white'}`}>
                            Vehicle Pooling
                        </h1>
                        <p className={`text-lg max-w-2xl mx-auto ${isWomenOnly ? 'text-pink-800/80 dark:text-pink-200/80' : 'text-gray-600 dark:text-gray-400'}`}>
                            Share your personal vehicle or find a ride. Reduce traffic, save money, and travel safer together.
                        </p>
                    </div>

                    <div className="inline-flex bg-white dark:bg-black/40 p-1.5 rounded-full border border-gray-100 dark:border-white/10 shadow-sm relative">
                        <div
                            className={`absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ${isWomenOnly ? 'bg-pink-600' : 'bg-[#07503E]'}`}
                            style={{
                                width: 'calc(50% - 6px)',
                                left: activeTab === 'find' ? '6px' : 'calc(50%)'
                            }}
                        />
                        <button
                            onClick={() => setActiveTab('find')}
                            className={`relative px-8 py-3 rounded-full text-sm font-bold transition-colors w-40 z-10 ${activeTab === 'find' ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Find a Ride
                        </button>
                        <button
                            onClick={() => setActiveTab('host')}
                            className={`relative px-8 py-3 rounded-full text-sm font-bold transition-colors w-40 z-10 ${activeTab === 'host' ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Host a Ride
                        </button>
                    </div>
                </div>

                {/* FIND A RIDE TAB */}
                {activeTab === 'find' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                        {/* Search Bar */}
                        <div className="bg-white dark:bg-card p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                            <div className="flex-1 flex gap-3 w-full">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                    <input value={searchFrom} onChange={e => setSearchFrom(e.target.value)} placeholder="Leaving from..." className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none text-sm dark:text-white" />
                                </div>
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <input value={searchTo} onChange={e => setSearchTo(e.target.value)} placeholder="Going to..." className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl outline-none text-sm dark:text-white" />
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                {["All", "Bike", "Car", "Scooter"].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type as any)}
                                        className={`px-4 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap transition-colors border ${filterType === type ? (isWomenOnly ? 'bg-pink-100 border-pink-200 text-pink-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <button onClick={fetchRides} className={`px-6 py-3.5 text-white font-bold rounded-2xl md:ml-2 w-full md:w-auto ${isWomenOnly ? 'bg-pink-600 hover:bg-pink-700' : 'bg-[#07503E] hover:bg-[#064031]'}`}>
                                Search
                            </button>
                        </div>

                        {/* Results Grid */}
                        {loadingRides ? (
                            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                        ) : rides.length === 0 ? (
                            <div className="text-center py-20 bg-white/50 dark:bg-black/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                <div className="text-5xl mb-4 opacity-50">🚗</div>
                                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No rides found</h3>
                                <p className="text-gray-500 mt-1">Try changing your route or vehicle type.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {rides.map((ride) => (
                                    <div key={ride._id} className="bg-white dark:bg-card rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-300">
                                                    {ride.hostName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{ride.hostName}</h4>
                                                    <p className="text-xs text-gray-500 font-medium flex items-center mt-1">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" /> Verified Host
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{ride.farePerSeat}</p>
                                                <p className="text-xs text-gray-500">per seat</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6 relative">
                                            <div className="absolute top-2.5 left-2 bottom-2.5 w-0.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                            <div className="flex gap-4 items-center relative z-10">
                                                <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
                                                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{ride.from}</p>
                                            </div>
                                            <div className="flex gap-4 items-center relative z-10">
                                                <div className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-500" />
                                                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{ride.to}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <div className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-gray-100 dark:border-transparent">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(ride.departureTime).toLocaleDateString()}
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-gray-100 dark:border-transparent">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-gray-100 dark:border-transparent">
                                                <Car className="w-3.5 h-3.5" />
                                                {ride.vehicleType} · {ride.vehicleDetails}
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-gray-100 dark:border-transparent">
                                                <User className="w-3.5 h-3.5" />
                                                {ride.availableSeats} seat(s) left
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setBookingRide(ride)}
                                            className={`w-full py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${isWomenOnly ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' : 'bg-[#E6F3EF] dark:bg-[#07503E]/20 text-[#07503E] dark:text-emerald-400 hover:bg-[#D5EAE2] dark:hover:bg-[#07503E]/40'}`}
                                        >
                                            Request Pool Ride <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* HOST A RIDE TAB */}
                {activeTab === 'host' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <form onSubmit={handleHostSubmit} className="bg-white dark:bg-card p-6 md:p-10 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl max-w-3xl mx-auto space-y-8">

                            {/* Route */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">1. Route & Schedule</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">Leaving from</label>
                                        <input required value={hostForm.from} onChange={e => setHostForm({ ...hostForm, from: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" placeholder="e.g. Hinjewadi Phase 3" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">Going to</label>
                                        <input required value={hostForm.to} onChange={e => setHostForm({ ...hostForm, to: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" placeholder="e.g. Shivajinagar" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">Date (Max 24h away)</label>
                                        <input required type="date" min={new Date().toISOString().split('T')[0]} value={hostForm.departureDate} onChange={e => setHostForm({ ...hostForm, departureDate: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">Time</label>
                                        <input required type="time" value={hostForm.departureTime} onChange={e => setHostForm({ ...hostForm, departureTime: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-white/10" />

                            {/* Vehicle */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">2. Vehicle Details</h3>
                                <div className="flex gap-3 mb-5">
                                    {["Bike", "Car", "Scooter"].map(type => (
                                        <button
                                            key={type} type="button" onClick={() => setHostForm({ ...hostForm, vehicleType: type as any })}
                                            className={`flex-1 py-3 border-2 rounded-xl text-sm font-bold transition-all ${hostForm.vehicleType === type ? (isWomenOnly ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-[#07503E] bg-emerald-50 text-[#07503E] dark:bg-[#07503E]/20 dark:text-emerald-400') : 'border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">Vehicle Model & License Plate</label>
                                    <input required value={hostForm.vehicleDetails} onChange={e => setHostForm({ ...hostForm, vehicleDetails: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" placeholder="e.g. Honda Activa 6G - MH12AA1111" />
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-white/10" />

                            {/* Fare & Seats */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">3. Booking & Payment</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">Available Seats</label>
                                        <input required type="number" min="1" max="6" value={hostForm.totalSeats} onChange={e => setHostForm({ ...hostForm, totalSeats: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">Fare (per seat) ₹</label>
                                        <input required type="number" min="0" value={hostForm.farePerSeat} onChange={e => setHostForm({ ...hostForm, farePerSeat: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" placeholder="e.g. 50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-1">UPI ID (For Balance)</label>
                                        <input required value={hostForm.paymentDetails} onChange={e => setHostForm({ ...hostForm, paymentDetails: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-transparent focus:border-blue-300 outline-none text-sm dark:text-white" placeholder="user@upi" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-4 flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    We collect a 10% advance from the rider instantly to secure the booking. The rider pays the remaining 90% via your UPI directly.
                                </p>
                            </div>

                            <button type="submit" disabled={postingRide} className={`w-full py-4 rounded-2xl font-bold text-white text-base shadow-md transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${postingRide ? 'opacity-70 cursor-wait' : ''} ${isWomenOnly ? 'bg-pink-600 hover:bg-pink-700' : 'bg-[#07503E] hover:bg-[#064031]'}`}>
                                {postingRide ? <Loader2 className="w-5 h-5 animate-spin" /> : <Car className="w-5 h-5" />}
                                Post Pool Ride to Community
                            </button>
                        </form>
                    </motion.div>
                )}

            </main>

            {/* 10% ADVANCE PAYMENT MODAL */}
            <AnimatePresence>
                {bookingRide && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isBooking && setBookingRide(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-card w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden">
                            <div className={`p-6 text-white ${isWomenOnly ? 'bg-gradient-to-br from-pink-600 to-rose-700' : 'bg-gradient-to-br from-[#07503E] to-emerald-800'}`}>
                                <button onClick={() => !isBooking && setBookingRide(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-extrabold mb-1 flex items-center gap-2">Confirm Booking</h2>
                                <p className="text-white/80 text-sm">Pay a small advance to instantly secure your seat.</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">{bookingRide.from} <span className="opacity-50 mx-1">→</span> {bookingRide.to}</p>
                                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                        <Car className="w-4 h-4" /> {bookingRide.vehicleType} • {bookingRide.hostName}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Total Seat Fare</span>
                                        <span className="font-semibold text-gray-900 dark:text-white flex items-center"><IndianRupee className="w-3.5 h-3.5" /> {bookingRide.farePerSeat}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">To Pay Host Later (90%)</span>
                                        <span className="font-semibold text-gray-600 dark:text-gray-400 flex items-center">- <IndianRupee className="w-3.5 h-3.5" /> {(bookingRide.farePerSeat * 0.9).toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-gray-800 w-full" />
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">To Pay Now (10% Advance)</span>
                                        <span className={`text-xl font-extrabold flex items-center ${isWomenOnly ? 'text-pink-600 dark:text-pink-400' : 'text-[#07503E] dark:text-emerald-400'}`}>
                                            <IndianRupee className="w-5 h-5" /> {(bookingRide.farePerSeat * 0.1).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-3 rounded-xl flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                                        Upon payment, instant WhatsApp notifications will be sent to you (+91 7058395184) and the host with contact details.
                                    </p>
                                </div>

                                <button
                                    onClick={handleBook}
                                    disabled={isBooking}
                                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${isBooking ? 'opacity-70 cursor-wait' : ''} ${isWomenOnly ? 'bg-pink-600 shadow-pink-600/20 hover:bg-pink-700' : 'bg-[#07503E] shadow-[#07503E]/20 hover:bg-[#064031]'}`}
                                >
                                    {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                    Pay ₹{(bookingRide.farePerSeat * 0.1).toFixed(2)} & Confirm Seat
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
