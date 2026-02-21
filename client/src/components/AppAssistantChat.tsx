import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot, X, Send, Loader2, MessageSquare, AlertTriangle, Sparkles,
    MapPin, ArrowRight, Clock, Ruler, IndianRupee, CheckCircle2,
    Ticket, CreditCard, Zap, TrendingDown, Shield, Download,
} from "lucide-react";
import { fetchAppAssistant, fetchChatbotRoute, bookJourney } from "../api/chatbotApi";
import type { Root, Route, Step } from "../types/chatbotRoute";
import type { BookingRequest, BookingResult, BookingSegment } from "../types/booking";

// ── Conversation state machine ───────────────────────────────────────────────────

type ChatPhase =
    | "idle"              // normal Q&A
    | "route_loading"     // fetching routes from /agent
    | "route_selection"   // showing 3 route cards
    | "booking_confirm"   // user chose a route, awaiting confirmation
    | "payment_loading"   // mocked 2-second payment
    | "booked";           // e-ticket shown

interface SelectedRoute {
    label: "fastest" | "cheapest" | "safest";
    fareOption: Root["fares"]["fastest"];
    rawRoute: Route | null;
    query: string;
    routeData: Root;
}

// ── Message types ────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    topic_allowed?: boolean;
    timestamp: Date;
    /** Special rendered payloads */
    payload?: {
        type: "routes" | "ticket";
        data: Root | BookingResult;
    };
}

// ── Quick suggestion chips ────────────────────────────────────────────────────────

const SUGGESTIONS = [
    "Take me from Shivajinagar to Hinjewadi",
    "How does live tracking work?",
    "What is Vehicle Pooling?",
    "How to use SOS feature?",
    "What are PMPML bus fares?",
    "Book from FC Road to Airport",
];

// ── Intent Detection ─────────────────────────────────────────────────────────────

const ROUTE_INTENT_RE = /\b(from|to|get to|go to|take me|travel|book|directions?|route|commute|how do i reach)\b/i;
const BOOK_INTENT_RE = /\b(book|confirm|yes|proceed|pay|done|ok lets go|book it|start journey)\b/i;

// ── Helpers ──────────────────────────────────────────────────────────────────────

function buildSegmentsFromRoute(route: Route | null, fare: Root["fares"]["fastest"]): BookingSegment[] {
    if (!route) {
        return [{
            mode: fare.mode,
            line_name: fare.mode,
            from_stop: fare.origin,
            to_stop: fare.destination,
            num_stops: 1,
            fare_inr: fare.estimated_fare_inr,
        }];
    }
    const transitSteps = route.steps.filter(
        (s: Step) => s.travel_mode.toUpperCase() === "TRANSIT" && s.transit_info
    );
    if (transitSteps.length === 0) {
        return [{
            mode: fare.mode,
            line_name: fare.mode,
            from_stop: route.origin,
            to_stop: route.destination,
            num_stops: 1,
            fare_inr: fare.estimated_fare_inr,
        }];
    }
    return transitSteps.map((s: Step) => ({
        mode: s.transit_info!.vehicle_type,
        line_name: s.transit_info!.line_name || fare.mode,
        from_stop: s.transit_info!.departure_stop,
        to_stop: s.transit_info!.arrival_stop,
        num_stops: s.transit_info!.num_stops,
        fare_inr: 0, // will be calculated by backend
    }));
}

// ── Route Card (inside chat) ──────────────────────────────────────────────────────

function InlineFareCard({
    label,
    icon,
    fare,
    accent,
    onClick,
}: {
    label: string;
    icon: React.ReactElement;
    fare: Root["fares"]["fastest"];
    accent: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-xl border p-3 hover:scale-[1.02] active:scale-100 transition-all duration-200 ${accent}`}
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {icon}
                    {label}
                </div>
                <span className="text-[10px] text-gray-400">{fare.mode}</span>
            </div>
            <div className="flex gap-3 text-xs mt-1">
                <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {fare.duration_minutes} min
                </span>
                <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <Ruler className="w-3 h-3 text-gray-400" />
                    {fare.distance_km} km
                </span>
                <span className="flex items-center gap-1 font-bold text-[#111439] dark:text-[#00D4FF]">
                    <IndianRupee className="w-3 h-3" />
                    {fare.estimated_fare_inr}
                </span>
            </div>
        </button>
    );
}

// ── Route Selection (inside chat bubble) ──────────────────────────────────────────

function RouteSelection({ data, onSelect }: { data: Root; onSelect: (r: SelectedRoute) => void }) {
    const query = data.query ?? "";
    const routeLookup: Record<string, Record<number, Route>> = {};
    data.routes.transit_options.forEach((opt) => {
        if (!opt.available) return;
        opt.routes.forEach((r) => {
            if (!routeLookup[opt.mode]) routeLookup[opt.mode] = {};
            routeLookup[opt.mode][r.route_number] = r;
        });
    });

    const pick = (fare: Root["fares"]["fastest"], label: "fastest" | "cheapest" | "safest") => {
        const rawRoute = routeLookup[fare.mode]?.[fare.route_number] ?? null;
        onSelect({ label, fareOption: fare, rawRoute, query, routeData: data });
    };

    return (
        <div className="space-y-2 w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" />
                {data.routes.origin}
                <ArrowRight className="w-3 h-3" />
                {data.routes.destination}
            </p>
            <InlineFareCard
                label="⚡ Fastest"
                icon={<Zap className="w-3 h-3" />}
                fare={data.fares.fastest}
                accent="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40 text-blue-800 dark:text-blue-200"
                onClick={() => pick(data.fares.fastest, "fastest")}
            />
            <InlineFareCard
                label="💰 Cheapest"
                icon={<TrendingDown className="w-3 h-3" />}
                fare={data.fares.cheapest}
                accent="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-200"
                onClick={() => pick(data.fares.cheapest, "cheapest")}
            />
            <InlineFareCard
                label="🛡️ Safest / Best Value"
                icon={<Shield className="w-3 h-3" />}
                fare={data.fares.best_value}
                accent="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40 text-indigo-800 dark:text-indigo-200"
                onClick={() => pick(data.fares.best_value, "safest")}
            />
        </div>
    );
}

// ── Booking Confirm prompt ─────────────────────────────────────────────────────────

function BookingConfirm({
    selected,
    onConfirm,
    onCancel,
}: {
    selected: SelectedRoute;
    onConfirm: (phone: string) => void;
    onCancel: () => void;
}) {
    const [phone, setPhone] = useState("");
    const labelColors: Record<string, string> = {
        fastest: "text-blue-600 dark:text-blue-400",
        cheapest: "text-emerald-600 dark:text-emerald-400",
        safest: "text-indigo-600 dark:text-indigo-400",
    };
    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-3 w-full">
            <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">Confirm Booking</p>
                <span className={`text-xs font-semibold capitalize ml-auto ${labelColors[selected.label]}`}>
                    {selected.label}
                </span>
            </div>

            <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    {selected.fareOption.origin}
                    <ArrowRight className="w-3 h-3 mx-0.5" />
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {selected.fareOption.destination}
                </div>
                <div className="flex gap-3 pt-1">
                    <span>{selected.fareOption.mode}</span>
                    <span>•</span>
                    <span>{selected.fareOption.duration_minutes} min</span>
                    <span>•</span>
                    <span className="font-bold text-[#111439] dark:text-[#00D4FF] flex items-center">
                        <IndianRupee className="w-3 h-3" />{selected.fareOption.estimated_fare_inr}
                    </span>
                </div>
            </div>

            {/* Optional phone for WhatsApp */}
            <div>
                <p className="text-[10px] text-gray-400 mb-1">Phone (optional — to receive ticket on WhatsApp)</p>
                <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full text-sm bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 dark:text-white placeholder-gray-400"
                />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onConfirm(phone)}
                    className="flex-1 bg-[#111439] hover:bg-[#1a1f5c] text-white font-bold text-sm py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                    <CreditCard className="w-3.5 h-3.5" />
                    Book & Pay ₹{selected.fareOption.estimated_fare_inr}
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ── E-Ticket Card (inside chat bubble) ────────────────────────────────────────────

function ETicketCard({ result }: { result: BookingResult }) {
    const modeIcon: Record<string, string> = {
        bus: "🚌", "metro / subway": "🚇", metro: "🚇",
        "auto / cab": "🛺", auto: "🛺", driving: "🛺",
        walking: "🚶", walk: "🚶",
    };

    return (
        <div className="bg-gradient-to-br from-[#635BFF]/10 via-[#00D4FF]/5 to-white dark:from-indigo-900/30 dark:via-[#00D4FF]/10 dark:to-transparent border-2 border-[#00D4FF]/20 dark:border-[#00D4FF]/40 rounded-2xl overflow-hidden w-full">
            {/* Header */}
            <div className="bg-[#111439] px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00D4FF]" />
                <div className="flex-1">
                    <p className="text-white font-bold text-sm">Booking Confirmed!</p>
                    <p className="text-[#00D4FF]/80 text-[10px]">SafarLink E-Ticket</p>
                </div>
                <div className="text-right">
                    <p className="text-white font-mono font-bold text-lg tracking-widest">{result.pnr}</p>
                    <p className="text-[#00D4FF]/80 text-[10px]">PNR</p>
                </div>
            </div>

            {/* Route info */}
            <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate font-medium">{result.origin}</span>
                    <ArrowRight className="w-3 h-3 shrink-0 mx-0.5" />
                    <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate font-medium">{result.destination}</span>
                </div>

                {/* Segments */}
                {result.segments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                        {result.segments.map((seg, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2">
                                <span className="text-base">{modeIcon[seg.mode.toLowerCase()] ?? "🚦"}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{seg.line_name}</p>
                                    <p className="text-gray-400 truncate">{seg.from_stop} → {seg.to_stop} ({seg.num_stops} stops)</p>
                                </div>
                                <span className="font-bold text-[#111439] dark:text-[#00D4FF] flex items-center shrink-0">
                                    <IndianRupee className="w-3 h-3" />{seg.fare_inr.toFixed(0)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payment summary */}
                <div className="border-t border-[#00D4FF]/20 dark:border-white/10 pt-2.5 mt-1 space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total Paid</span>
                        <span className="font-bold text-[#111439] dark:text-[#00D4FF] flex items-center text-base">
                            <IndianRupee className="w-4 h-4" />{result.total_fare_inr.toFixed(0)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Payment ID</span>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{result.payment_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Ticket ID</span>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{result.ticket_id.slice(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Booked at</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{result.booking_time}</span>
                    </div>
                </div>

                {/* WhatsApp notice */}
                {result.phone && (
                    <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl px-3 py-2 text-xs text-green-700 dark:text-green-300">
                        <span className="text-base">📱</span>
                        Ticket sent to WhatsApp ({result.phone})
                    </div>
                )}

                {/* Metro QR Code */}
                {result.qr_data && (
                    <div className="bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-700/40 rounded-2xl p-3 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            <span>🚇</span> Metro QR Ticket — Scan at Entry Gate
                        </div>
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                            <img
                                src={result.qr_data}
                                alt={`QR Code for PNR ${result.pnr}`}
                                width={140}
                                height={140}
                                className="rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono tracking-widest">{result.pnr}</p>
                        <p className="text-[9px] text-gray-400 text-center">Valid for single journey · Non-transferable</p>
                    </div>
                )}

                {/* Mock download button */}
                <button className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-white/10 rounded-xl py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Download Ticket (PDF)
                </button>

            </div>
        </div>
    );
}

// ── Message Bubble ────────────────────────────────────────────────────────────────

function MessageBubble({
    msg,
    onSelectRoute,
    selectedRoute,
    onConfirmBook,
    onCancelBook,
    phase,
}: {
    msg: Message;
    onSelectRoute: (r: SelectedRoute) => void;
    selectedRoute: SelectedRoute | null;
    onConfirmBook: (phone: string) => void;
    onCancelBook: () => void;
    phase: ChatPhase;
}) {
    const isUser = msg.role === "user";
    const isRefused = msg.role === "assistant" && msg.topic_allowed === false;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}

            <div className={`max-w-[88%] space-y-0.5 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                {/* Route selection payload */}
                {msg.payload?.type === "routes" && (
                    <RouteSelection
                        data={msg.payload.data as Root}
                        onSelect={onSelectRoute}
                    />
                )}

                {/* Booking confirm */}
                {msg.payload?.type === "routes" && selectedRoute && phase === "booking_confirm" && (
                    <BookingConfirm
                        selected={selectedRoute}
                        onConfirm={onConfirmBook}
                        onCancel={onCancelBook}
                    />
                )}

                {/* E-ticket */}
                {msg.payload?.type === "ticket" && (
                    <ETicketCard result={msg.payload.data as BookingResult} />
                )}

                {/* Text bubble */}
                {msg.content && (
                    <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                            ? "bg-[#635BFF] text-white rounded-tr-sm"
                            : isRefused
                                ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-200 rounded-tl-sm"
                                : "bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-tl-sm shadow-sm"
                            }`}
                    >
                        {isRefused && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Out of scope</span>
                            </div>
                        )}
                        {msg.content}
                    </div>
                )}

                <span className="text-[9px] text-gray-400 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────────

export default function AppAssistantChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [phase, setPhase] = useState<ChatPhase>("idle");
    const [selectedRoute, setSelectedRoute] = useState<SelectedRoute | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hi! I'm the SafarLink Assistant 👋\n\nYou can ask me about the app, or tell me where you want to go and I'll plan your route and book your ticket!\n\nTry: \"Take me from FC Road to Pune Airport\"",
            topic_allowed: true,
            timestamp: new Date(),
        },
    ]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, open]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 200);
    }, [open]);

    const addMessage = (msg: Omit<Message, "id" | "timestamp">) =>
        setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() + "", timestamp: new Date() }]);

    // ── Handle route selection ────────────────────────────────────────────────────

    const handleSelectRoute = (route: SelectedRoute) => {
        setSelectedRoute(route);
        setPhase("booking_confirm");
        addMessage({
            role: "assistant",
            content: `Great choice! You selected the *${route.label}* option via ${route.fareOption.mode}.\n\nFare: ₹${route.fareOption.estimated_fare_inr} · ${route.fareOption.duration_minutes} min · ${route.fareOption.distance_km} km\n\nReady to confirm your booking?`,
        });
    };

    // ── Handle booking confirmation ───────────────────────────────────────────────

    const handleConfirmBook = async (phone: string) => {
        if (!selectedRoute) return;
        setPhase("payment_loading");
        addMessage({ role: "user", content: "Book & Pay ₹" + selectedRoute.fareOption.estimated_fare_inr });
        addMessage({ role: "assistant", content: "Processing payment… 💳" });

        // Mock 2-second payment delay
        await new Promise(res => setTimeout(res, 2000));

        const segments = buildSegmentsFromRoute(selectedRoute.rawRoute, selectedRoute.fareOption);
        const request: BookingRequest = {
            origin: selectedRoute.fareOption.origin,
            destination: selectedRoute.fareOption.destination,
            route_type: selectedRoute.label,
            transit_segments: segments,
            passenger_name: "SafarLink User",
            phone: phone || undefined,
            estimated_fare_inr: selectedRoute.fareOption.estimated_fare_inr,
        };

        try {
            const result = await bookJourney(request);
            setPhase("booked");
            setSelectedRoute(null);

            addMessage({
                role: "assistant",
                content: `✅ Payment of ₹${result.total_fare_inr} successful!\n\nYour ticket is confirmed. PNR: *${result.pnr}*${phone ? "\n\nTicket sent to WhatsApp 📱" : ""}`,
                payload: { type: "ticket", data: result },
            });
        } catch {
            setPhase("idle");
            addMessage({
                role: "assistant",
                content: "⚠️ Booking failed. Please make sure the SafarLink server is running and try again.",
            });
        }
    };

    const handleCancelBook = () => {
        setPhase("route_selection");
        setSelectedRoute(null);
        addMessage({ role: "assistant", content: "No problem! Tap a different route option above to choose another." });
    };

    // ── Handle user message ───────────────────────────────────────────────────────

    const sendMessage = async (text: string) => {
        const q = text.trim();
        if (!q || phase === "route_loading" || phase === "payment_loading") return;

        addMessage({ role: "user", content: q });
        setInput("");

        // If user is confirming/cancelling during booking_confirm phase
        if (phase === "booking_confirm" && selectedRoute) {
            if (BOOK_INTENT_RE.test(q)) {
                await handleConfirmBook("");
            } else if (/\b(cancel|no|back|stop)\b/i.test(q)) {
                handleCancelBook();
            } else {
                addMessage({ role: "assistant", content: "Click the *Book & Pay* button above to confirm your booking, or *Cancel* to choose a different route." });
            }
            return;
        }

        // Detect route planning intent
        if (ROUTE_INTENT_RE.test(q)) {
            setPhase("route_loading");
            addMessage({ role: "assistant", content: "🔍 Finding the best routes for you, one moment…" });
            try {
                const data = await fetchChatbotRoute(q);
                setPhase("route_selection");
                addMessage({
                    role: "assistant",
                    content: `Here are your route options from *${data.routes.origin}* to *${data.routes.destination}*. Tap one to select it:`,
                    payload: { type: "routes", data },
                });
            } catch {
                setPhase("idle");
                addMessage({
                    role: "assistant",
                    content: "❌ Couldn't fetch routes. Make sure the SafarLink chatbot server is running on port 8000.",
                    topic_allowed: false,
                });
            }
            return;
        }

        // Otherwise: general app Q&A
        try {
            const resp = await fetchAppAssistant(q);
            addMessage({ role: "assistant", content: resp.answer, topic_allowed: resp.topic_allowed });
        } catch {
            addMessage({
                role: "assistant",
                content: "⚠️ Couldn't reach the assistant. Please check the server is running.",
                topic_allowed: false,
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    const isLoading = phase === "route_loading" || phase === "payment_loading";

    const loadingLabel =
        phase === "route_loading" ? "Finding routes…" :
            phase === "payment_loading" ? "Processing payment…" :
                "Thinking…";

    const showSuggestions = messages.length <= 1;

    return (
        <>
            {/* ── Chat Panel ──────────────────────────────────────────────────── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="chat-panel"
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: "spring", damping: 22, stiffness: 260 }}
                        className="fixed bottom-24 right-5 z-50 w-[360px] sm:w-[400px] flex flex-col rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-gray-200 dark:border-white/10 bg-[#F8F8F9] dark:bg-[#0f1a14]"
                        style={{ maxHeight: "min(640px, 82vh)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white shrink-0">
                            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm leading-tight">SafarLink Assistant</p>
                                <p className="text-[10px] text-indigo-200 leading-tight flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                                    {phase === "route_selection" ? "Route Selection" :
                                        phase === "booking_confirm" ? "Ready to Book" :
                                            phase === "booked" ? "Ticket Confirmed ✓" :
                                                "Plan · Book · Go"}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {messages.map(msg => (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    onSelectRoute={handleSelectRoute}
                                    selectedRoute={selectedRoute}
                                    onConfirmBook={handleConfirmBook}
                                    onCancelBook={handleCancelBook}
                                    phase={phase}
                                />
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-2 items-start"
                                >
                                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                    <div className="px-3.5 py-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-sm">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                                            <span className="ml-1">{loadingLabel}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Quick suggestions on first open */}
                            {showSuggestions && !isLoading && (
                                <div className="pt-2 space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Try asking
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {SUGGESTIONS.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => sendMessage(s)}
                                                className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-black/20 shrink-0">
                            <div className="flex gap-2 items-center bg-gray-50 dark:bg-white/5 rounded-2xl px-3 py-2 border border-gray-200 dark:border-white/10 focus-within:border-indigo-400 transition-colors">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        phase === "booking_confirm"
                                            ? "Type 'book' to confirm or 'cancel'…"
                                            : "Ask or say where you want to go…"
                                    }
                                    disabled={isLoading}
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={isLoading || !input.trim()}
                                    className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors shrink-0"
                                    aria-label="Send"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-[9px] text-center text-gray-400 mt-1.5">
                                SafarLink · Plan journeys, book tickets, get help
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Floating Action Button ──────────────────────────────────────── */}
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setOpen(v => !v)}
                className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl shadow-indigo-500/30 flex items-center justify-center text-white transition-all"
                aria-label="Open SafarLink Assistant"
            >
                {/* Badge when booked */}
                {phase === "booked" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                )}
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.18 }}>
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.18 }}>
                            <MessageSquare className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </>
    );
}
