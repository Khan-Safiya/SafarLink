import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Clock, Banknote, Route, Award, Gift, ChevronDown, ChevronUp, CheckCircle2, User } from "lucide-react";
import Navbar from "../components/Navbar";
import { useUser } from "@clerk/clerk-react";

const SERVER = "http://localhost:5000";

interface Feedback {
    _id: string;
    userId: string;
    journeyType: "bus" | "metro" | "auto" | "pool" | "walk";
    origin: string;
    destination: string;
    routeAccuracy: number;
    comfortRating: number;
    waitTimeRating: number;
    overallRating: number;
    journeyTimeMatch: boolean;
    fareMatch: boolean;
    actualFare?: number;
    estimatedFare?: number;
    hasDriverFeedback: boolean;
    driverName?: string;
    driverOverallRating?: number;
    comment?: string;
    createdAt: string;
}

interface UserStats {
    totalFeedbacks: number;
    earnedMilestones: number[];
    availableCoupons: { code: string; discountPct: number; milestone: number; expiresAt: string }[];
    nextMilestone: number | null;
    feedbacksUntilNext: number;
    progressPct: number;
    averages: {
        routeAccuracy: number;
        comfort: number;
        waitTime: number;
        fareMatchRate: number;
        timeMatchRate: number;
    };
}

const MODE_COLOR: Record<string, string> = {
    bus: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    metro: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    auto: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    pool: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    walk: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
};

const MODE_EMOJI: Record<string, string> = {
    bus: "🚌", metro: "🚇", auto: "🛺", pool: "🚗", walk: "🚶",
};

const MILESTONES = [25, 50, 75, 100];

function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
    const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`${sz} ${s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-700"}`} />
            ))}
        </div>
    );
}

function FeedbackCard({ fb, isOwn }: { fb: Feedback; isOwn: boolean }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-[#111439]/60 rounded-2xl border ${isOwn ? "border-[#635BFF]/40 shadow-md shadow-[#635BFF]/10" : "border-gray-100 dark:border-white/5"} p-4 space-y-3`}
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${MODE_COLOR[fb.journeyType]}`}>
                        {MODE_EMOJI[fb.journeyType]} {fb.journeyType.toUpperCase()}
                    </span>
                    {isOwn && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF]">
                            You
                        </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(fb.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <StarDisplay value={fb.overallRating} />
                    <span className="text-sm font-bold text-[#111439] dark:text-white">{fb.overallRating}/5</span>
                </div>
            </div>

            {/* Route */}
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                <Route className="w-3.5 h-3.5 text-[#635BFF] shrink-0" />
                <span className="truncate">{fb.origin}</span>
                <span className="text-gray-400">→</span>
                <span className="truncate">{fb.destination}</span>
            </div>

            {/* Quick pills */}
            <div className="flex flex-wrap gap-2">
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${fb.journeyTimeMatch ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-red-50 dark:bg-red-900/20 text-red-500"}`}>
                    <Clock className="w-3 h-3" />
                    {fb.journeyTimeMatch ? "Time matched" : "Time off"}
                </span>
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${fb.fareMatch ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-red-50 dark:bg-red-900/20 text-red-500"}`}>
                    <Banknote className="w-3 h-3" />
                    {fb.fareMatch ? "Fare matched" : `Paid ₹${fb.actualFare ?? "?"}`}
                </span>
            </div>

            {/* Expand / collapse detail */}
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-[#635BFF] font-semibold hover:underline">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? "Less" : "Details"}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-2 space-y-2 border-t border-gray-100 dark:border-white/5">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: "Accuracy", val: fb.routeAccuracy },
                                    { label: "Comfort", val: fb.comfortRating },
                                    { label: "Wait Time", val: fb.waitTimeRating },
                                ].map(({ label, val }) => (
                                    <div key={label} className="text-center bg-gray-50 dark:bg-white/5 rounded-xl p-2">
                                        <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                                        <StarDisplay value={val} />
                                    </div>
                                ))}
                            </div>
                            {fb.hasDriverFeedback && fb.driverName && (
                                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-2">
                                    <User className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{fb.driverName}</span>
                                    {fb.driverOverallRating && <StarDisplay value={fb.driverOverallRating} />}
                                </div>
                            )}
                            {fb.comment && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
                                    "{fb.comment}"
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function FeedbackWall() {
    const { user } = useUser();
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        // Fetch all feedbacks via route-accuracy endpoint + history
        Promise.all([
            fetch(`${SERVER}/api/feedback/history/${user?.id ?? "anonymous"}`).then(r => r.json()),
            user?.id ? fetch(`${SERVER}/api/feedback/stats/${user.id}`).then(r => r.json()) : Promise.resolve(null),
        ]).then(([myFeedbacks, stats]) => {
            setFeedbacks(Array.isArray(myFeedbacks) ? myFeedbacks : []);
            setUserStats(stats);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user?.id]);

    const filtered = filter === "all" ? feedbacks : feedbacks.filter(f => f.journeyType === filter);
    const nextMilestone = userStats?.nextMilestone ?? 25;
    const total = userStats?.totalFeedbacks ?? 0;

    const progressPct = userStats?.progressPct ?? 0;

    return (
        <div className="relative min-h-screen font-sans bg-[#F8F8F9] dark:bg-background overflow-x-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-[#635BFF] rounded-full blur-[140px] opacity-15 mix-blend-multiply z-0 pointer-events-none" />
            <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-[#00D4FF] rounded-full blur-[120px] opacity-10 mix-blend-multiply z-0 pointer-events-none" />

            <Navbar isWomenOnly={isWomenOnly} setIsWomenOnly={setIsWomenOnly} isDriverMode={isDriverMode} setIsDriverMode={setIsDriverMode} />

            <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

                {/* Page Header */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#635BFF] to-[#00D4FF] rounded-2xl flex items-center justify-center shadow-lg">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#111439] dark:text-white">Feedback Wall</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Community reviews that improve every SafarLink route</p>
                        </div>
                    </div>
                </motion.div>

                {/* User stats banner */}
                {userStats !== null && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-[#111439] to-[#1e1b7e] rounded-3xl p-5 text-white shadow-xl"
                    >
                        <div className="flex flex-wrap gap-6 items-center justify-between">
                            {/* Count + progress */}
                            <div className="space-y-2 flex-1 min-w-[220px]">
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-400" />
                                    <span className="text-sm font-semibold text-white/80">Your Feedback Journey</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold">{total}</span>
                                    <span className="text-white/60 text-sm mb-1">feedbacks given</span>
                                </div>
                                {nextMilestone && (
                                    <>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPct}%` }}
                                                transition={{ duration: 1.2, delay: 0.4 }}
                                            />
                                        </div>
                                        <p className="text-xs text-white/60">
                                            <strong className="text-amber-400">{userStats.feedbacksUntilNext} more</strong> to unlock your next 25% discount (at {nextMilestone})
                                        </p>
                                    </>
                                )}
                                {total >= 100 && !nextMilestone && (
                                    <p className="text-xs text-amber-400 font-semibold">🏆 All milestones unlocked! You are a SafarLink Champion.</p>
                                )}
                            </div>

                            {/* Milestone dots */}
                            <div className="space-y-2">
                                <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Milestones</p>
                                <div className="flex gap-3">
                                    {MILESTONES.map(m => {
                                        const done = userStats.earnedMilestones.includes(m);
                                        return (
                                            <div key={m} className="flex flex-col items-center gap-1">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                                                    ${done ? "bg-amber-400 border-amber-400" : "bg-white/10 border-white/20"}`}>
                                                    {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="text-xs text-white/50 font-bold">{m}</span>}
                                                </div>
                                                <span className="text-[9px] text-white/40">{done ? "✓" : `${m}`}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Coupons */}
                            {userStats.availableCoupons.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-white/50 font-semibold uppercase tracking-wide flex items-center gap-1"><Gift className="w-3.5 h-3.5" />Active Coupons</p>
                                    {userStats.availableCoupons.slice(0, 3).map(c => (
                                        <div key={c.code} className="bg-amber-400/20 border border-amber-400/30 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold tracking-widest text-amber-300">{c.code}</span>
                                            <span className="text-xs text-amber-400 font-bold">{c.discountPct}% OFF</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Averages row */}
                        {total > 0 && userStats.averages && (
                            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {[
                                    { label: "Route Accuracy", val: userStats.averages.routeAccuracy, stars: true },
                                    { label: "Comfort", val: userStats.averages.comfort, stars: true },
                                    { label: "Wait Time", val: userStats.averages.waitTime, stars: true },
                                    { label: "Fare Match", val: userStats.averages.fareMatchRate, stars: false, pct: true },
                                    { label: "Time Match", val: userStats.averages.timeMatchRate, stars: false, pct: true },
                                ].map(({ label, val, stars, pct }) => (
                                    <div key={label} className="text-center">
                                        <p className="text-[10px] text-white/40 mb-1">{label}</p>
                                        {stars ? (
                                            <div className="flex justify-center">
                                                <StarDisplay value={val} />
                                            </div>
                                        ) : (
                                            <p className={`text-sm font-bold ${(val as number) >= 70 ? "text-emerald-400" : "text-red-400"}`}>{val}{pct ? "%" : ""}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Filter tabs */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2">
                    {["all", "bus", "metro", "auto", "pool", "walk"].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border ${filter === t
                                ? "bg-[#635BFF] text-white border-[#635BFF] shadow-sm"
                                : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-white/10 hover:border-[#635BFF]/50"}`}
                        >
                            {t === "all" ? "All" : `${MODE_EMOJI[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 self-center">{filtered.length} review{filtered.length !== 1 ? "s" : ""}</span>
                </motion.div>

                {/* Feedback list */}
                {loading ? (
                    <div className="flex flex-col items-center py-16 gap-4">
                        <div className="w-10 h-10 border-4 border-[#635BFF]/30 border-t-[#635BFF] rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading feedbacks…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 gap-3 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-200 dark:text-gray-700" />
                        <p className="text-lg font-bold text-gray-400 dark:text-gray-500">No feedbacks yet</p>
                        <p className="text-sm text-gray-400">Complete a journey on Live Tracking to leave your first review!</p>
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {filtered.map(fb => (
                                <FeedbackCard key={fb._id} fb={fb} isOwn={fb.userId === user?.id} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
