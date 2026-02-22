import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, ChevronRight, CheckCircle2, Gift, Clock, Banknote, Route, ThumbsUp, ThumbsDown, User } from "lucide-react";

const SERVER = "http://localhost:5000";

interface FeedbackModalProps {
    userId: string;
    journeyId: string;
    journeyType: "bus" | "metro" | "auto" | "pool" | "walk";
    origin: string;
    destination: string;
    estimatedJourneyMinutes?: number;
    estimatedFare?: number;
    // Driver info — only needed for auto/pool
    driverId?: string;
    driverName?: string;
    onClose: () => void;
}

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                    <button
                        key={s}
                        onClick={() => onChange(s)}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-7 h-7 ${s <= (hover || value)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300 dark:text-gray-600"} transition-colors`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

function BoolPick({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: boolean | null; onChange: (v: boolean) => void }) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">{icon}{label}</p>
            <div className="flex gap-3">
                <button
                    onClick={() => onChange(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-bold transition-all
                    ${value === true ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-emerald-400"}`}
                >
                    <ThumbsUp className="w-4 h-4" /> Yes
                </button>
                <button
                    onClick={() => onChange(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-bold transition-all
                    ${value === false ? "bg-red-500 border-red-500 text-white" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-red-400"}`}
                >
                    <ThumbsDown className="w-4 h-4" /> No
                </button>
            </div>
        </div>
    );
}

export default function JourneyFeedbackModal({
    userId, journeyId, journeyType, origin, destination,
    estimatedJourneyMinutes, estimatedFare,
    driverId, driverName, onClose,
}: FeedbackModalProps) {
    const hasDriver = (journeyType === "auto" || journeyType === "pool") && !!driverId;
    const totalSteps = hasDriver ? 3 : 2; // 1: journey, 2: driver (if applicable), 3: done

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ totalFeedbacks: number; newMilestone: any; nextMilestone: number | null; feedbacksUntilNext: number } | null>(null);

    // Journey ratings
    const [routeAccuracy, setRouteAccuracy] = useState(0);
    const [comfortRating, setComfortRating] = useState(0);
    const [waitTimeRating, setWaitTimeRating] = useState(0);
    const [overallRating, setOverallRating] = useState(0);
    const [journeyTimeMatch, setJourneyTimeMatch] = useState<boolean | null>(null);
    const [fareMatch, setFareMatch] = useState<boolean | null>(null);
    const [actualFare, setActualFare] = useState("");
    const [comment, setComment] = useState("");

    // Driver ratings
    const [driverPunctuality, setDriverPunctuality] = useState(0);
    const [driverBehavior, setDriverBehavior] = useState(0);
    const [vehicleCondition, setVehicleCondition] = useState(0);
    const [driverOverallRating, setDriverOverallRating] = useState(0);

    const journeyValid = routeAccuracy > 0 && comfortRating > 0 && waitTimeRating > 0 && overallRating > 0
        && journeyTimeMatch !== null && fareMatch !== null;
    const driverValid = driverPunctuality > 0 && driverBehavior > 0 && vehicleCondition > 0 && driverOverallRating > 0;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                userId, journeyId, journeyType, origin, destination,
                routeAccuracy, comfortRating, waitTimeRating, overallRating,
                journeyTimeMatch: journeyTimeMatch!,
                fareMatch: fareMatch!,
                estimatedJourneyMinutes,
                estimatedFare: estimatedFare ?? undefined,
                actualFare: actualFare ? parseFloat(actualFare) : undefined,
                comment: comment || undefined,
                hasDriverFeedback: hasDriver,
                ...(hasDriver && {
                    driverId, driverName,
                    driverPunctuality, driverBehavior, vehicleCondition, driverOverallRating,
                }),
            };
            const r = await fetch(`${SERVER}/api/feedback/journey`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await r.json();
            setResult(data);
            setStep(totalSteps + 1); // done step
        } catch {
            setResult(null);
        } finally {
            setSubmitting(false);
        }
    };

    const progressPct = Math.min((step / (totalSteps + 1)) * 100, 95);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-end sm:items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                className="w-full max-w-md bg-white dark:bg-[#111439] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#635BFF] to-[#00D4FF] px-6 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-white font-bold text-lg">Rate Your Journey</p>
                        <p className="text-white/80 text-xs">{origin} → {destination}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-100 dark:bg-white/10">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#635BFF] to-[#00D4FF]"
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    <AnimatePresence mode="wait">

                        {/* ── Step 1: Journey Feedback ── */}
                        {step === 1 && (
                            <motion.div key="journey" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <p className="text-sm font-bold text-[#111439] dark:text-white flex items-center gap-2">
                                    <Route className="w-4 h-4 text-[#635BFF]" /> Journey Quality
                                </p>
                                <StarRating label="Route Accuracy — Was the route suggestion correct?" value={routeAccuracy} onChange={setRouteAccuracy} />
                                <StarRating label="Comfort — How comfortable was the journey?" value={comfortRating} onChange={setComfortRating} />
                                <StarRating label="Wait Time — Did the vehicle arrive as expected?" value={waitTimeRating} onChange={setWaitTimeRating} />
                                <StarRating label="Overall Rating" value={overallRating} onChange={setOverallRating} />
                                <BoolPick label="Did journey time match the estimate?" icon={<Clock className="w-4 h-4 text-blue-500" />} value={journeyTimeMatch} onChange={setJourneyTimeMatch} />
                                <BoolPick label="Did the fare match the estimate?" icon={<Banknote className="w-4 h-4 text-emerald-500" />} value={fareMatch} onChange={setFareMatch} />
                                {fareMatch === false && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Actual Fare Paid (₹)</label>
                                        <input
                                            type="number" value={actualFare} onChange={e => setActualFare(e.target.value)}
                                            placeholder="e.g. 45"
                                            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#635BFF]"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Additional comments (optional)</label>
                                    <textarea
                                        value={comment} onChange={e => setComment(e.target.value)} rows={2}
                                        placeholder="Anything to improve?"
                                        className="mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#635BFF] resize-none"
                                    />
                                </div>
                                <button
                                    disabled={!journeyValid}
                                    onClick={() => hasDriver ? setStep(2) : handleSubmit()}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#111439] dark:bg-[#635BFF] text-white font-bold disabled:opacity-40 hover:opacity-90 transition-all"
                                >
                                    {hasDriver ? "Next: Rate Driver" : (submitting ? "Submitting…" : "Submit Feedback")}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* ── Step 2: Driver Feedback (auto/pool only) ── */}
                        {step === 2 && hasDriver && (
                            <motion.div key="driver" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                                    <div className="w-10 h-10 bg-[#635BFF] rounded-full flex items-center justify-center text-white">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#111439] dark:text-white text-sm">{driverName ?? "Your Driver"}</p>
                                        <p className="text-xs text-indigo-500">{journeyType === "pool" ? "Pool Ride Driver" : "Auto Driver"}</p>
                                    </div>
                                </div>
                                <StarRating label="Punctuality — Was the driver on time?" value={driverPunctuality} onChange={setDriverPunctuality} />
                                <StarRating label="Behaviour — Was the driver courteous?" value={driverBehavior} onChange={setDriverBehavior} />
                                <StarRating label="Vehicle Condition — Cleanliness & safety?" value={vehicleCondition} onChange={setVehicleCondition} />
                                <StarRating label="Overall Driver Rating" value={driverOverallRating} onChange={setDriverOverallRating} />
                                <div className="flex gap-3">
                                    <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                        Back
                                    </button>
                                    <button
                                        disabled={!driverValid || submitting}
                                        onClick={handleSubmit}
                                        className="flex-1 py-3 rounded-2xl bg-[#111439] dark:bg-[#635BFF] text-white font-bold disabled:opacity-40 hover:opacity-90 transition-all"
                                    >
                                        {submitting ? "Submitting…" : "Submit"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Done / Reward ── */}
                        {step === totalSteps + 1 && (
                            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-[#111439] dark:text-white">Thank you! 🎉</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your feedback helps improve routes for everyone.</p>
                                </div>

                                {result && (
                                    <>
                                        {/* Milestone unlocked! */}
                                        {result.newMilestone && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white text-left shadow-lg"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Gift className="w-5 h-5" />
                                                    <span className="font-bold">Milestone Unlocked! 🎁</span>
                                                </div>
                                                <p className="text-sm text-white/90">
                                                    You've completed <strong>{result.newMilestone.milestone}</strong> feedbacks!
                                                    Enjoy <strong>25% off</strong> your next ride.
                                                </p>
                                                <div className="mt-2 bg-white/20 rounded-xl px-3 py-2 font-mono text-sm font-bold tracking-widest">
                                                    {result.newMilestone.coupon.code}
                                                </div>
                                                <p className="text-[10px] text-white/70 mt-1">Valid for 3 months.</p>
                                            </motion.div>
                                        )}

                                        {/* Progress to next milestone */}
                                        {!result.newMilestone && result.nextMilestone && (
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 text-left">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Gift className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Earn a Reward!</span>
                                                </div>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                                                    <strong>{result.feedbacksUntilNext}</strong> more feedbacks for <strong>25% off</strong> your next ride ({result.nextMilestone} total)
                                                </p>
                                                <div className="w-full h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-[#635BFF] to-[#00D4FF] rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.round((result.totalFeedbacks / result.nextMilestone) * 100)}%` }}
                                                        transition={{ duration: 1, delay: 0.3 }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-indigo-500 mt-1">{result.totalFeedbacks} / {result.nextMilestone} feedbacks</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                <button onClick={onClose} className="w-full py-3 rounded-2xl bg-[#111439] dark:bg-[#635BFF] text-white font-bold hover:opacity-90 transition-all">
                                    Close
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
