import { useState } from "react";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Map } from "lucide-react";
import VerificationStatusStepper from "../components/VerificationStatusStepper";
import { motion } from "framer-motion";

// Mock Data
const EARNINGS_DATA = [
    { label: "Today", amount: 850, rides: 12 },
    { label: "This Week", amount: 5400, rides: 68 },
    { label: "This Month", amount: 22500, rides: 245 },
];

const HEATMAP_ZONES = [
    { area: "Tech Park Phase 1", demand: "High", surge: "1.5x", distance: "2 km" },
    { area: "Metro Station", demand: "Very High", surge: "2.0x", distance: "0.5 km" },
    { area: "University Road", demand: "Moderate", surge: "1.2x", distance: "4 km" },
];

export default function DriverDashboard() {
    const [isDriverMode, setIsDriverMode] = useState(true); // Default to driver mode
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isOnline, setIsOnline] = useState(false);

    return (
        <div className="min-h-screen font-sans bg-gray-50 dark:bg-background transition-colors duration-500 overflow-x-hidden">
            <Navbar
                isWomenOnly={isWomenOnly}
                setIsWomenOnly={setIsWomenOnly}
                isDriverMode={isDriverMode}
                setIsDriverMode={setIsDriverMode}
            />

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 z-10 relative">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#07503E] dark:text-white mb-2">
                            Driver Command Center
                        </h1>
                        <p className="text-[#07503E]/70 dark:text-muted-foreground">
                            Welcome back, Rajesh. Your vehicle verified status is <span className="text-amber-500 font-bold">Pending</span>.
                        </p>
                    </div>

                    <div className={`flex items-center gap-4 px-6 py-3 rounded-full border shadow-sm ${isOnline ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-white/10'}`}>
                        <span className={`font-bold ${isOnline ? 'text-green-700' : 'text-gray-500'}`}>
                            {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
                        </span>
                        <Switch
                            checked={isOnline}
                            onCheckedChange={setIsOnline}
                            className={`${isOnline ? 'bg-green-600' : 'bg-gray-300'}`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Earnings Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {EARNINGS_DATA.map((item, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                    <Card className="border-l-4 border-l-[#2FCE65]">
                                        <CardContent className="p-5">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                                            <p className="text-2xl font-bold text-[#07503E] dark:text-white">₹{item.amount}</p>
                                            <p className="text-xs text-[#07503E]/60 dark:text-gray-400 mt-1">{item.rides} rides completed</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Demand Heatmap */}
                        <Card className="overflow-hidden border-2 border-[#07503E]/5 dark:border-white/10">
                            <CardHeader className="bg-gray-50/50 dark:bg-white/5">
                                <CardTitle className="flex justify-between items-center text-[#07503E] dark:text-white">
                                    <span className="flex items-center gap-2"><Map className="w-5 h-5" /> Live Demand Map</span>
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 animate-pulse">High Demand</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="h-64 bg-gray-200 dark:bg-black/20 flex items-center justify-center relative">
                                    {/* Placeholder Map */}
                                    <div className="absolute inset-0 bg-[url('/heatmap-placeholder.png')] bg-cover opacity-50"></div>
                                    <p className="relative z-10 font-bold text-gray-500 bg-white/80 px-4 py-2 rounded-lg backdrop-blur-sm">Interactive Heatmap Loading...</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-card">
                                    <h4 className="font-bold text-sm text-gray-500 mb-3 uppercase tracking-wider">Nearby Hotspots</h4>
                                    <div className="space-y-3">
                                        {HEATMAP_ZONES.map((zone, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 transition-colors cursor-pointer">
                                                <div>
                                                    <p className="font-bold text-[#07503E] dark:text-white">{zone.area}</p>
                                                    <p className="text-xs text-gray-500">{zone.distance} away</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 mb-1">{zone.surge}</Badge>
                                                    <p className="text-xs font-bold text-red-500">{zone.demand}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Verification & Profile */}
                    <div className="space-y-8">
                        <VerificationStatusStepper />

                        <Card className="bg-[#07503E] text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2FCE65] rounded-full blur-[60px] opacity-20"></div>
                            <CardContent className="p-6 relative z-10">
                                <h3 className="font-bold text-xl mb-2">Refer a Driver</h3>
                                <p className="text-white/70 text-sm mb-4">Earn ₹500 for every verified driver you refer to SafarLink.</p>
                                <Button className="w-full bg-white text-[#07503E] hover:bg-gray-100 font-bold">
                                    Share Referral Code
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </main>
        </div>
    );
}
