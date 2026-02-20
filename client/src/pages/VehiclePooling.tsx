import { useState } from "react";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, User, Search, Clock } from "lucide-react";
import { motion } from "framer-motion";

// Mock Data for Rides
const MOCK_RIDES = [
    { id: 1, driver: "Rajesh K.", type: "Share Auto", seats: 2, price: 20, time: "5 min away", rating: 4.8, womenOnly: false },
    { id: 2, driver: "Priya M.", type: "Car Pool", seats: 3, price: 45, time: "2 min away", rating: 4.9, womenOnly: true },
    { id: 3, driver: "Amit S.", type: "Share Auto", seats: 1, price: 20, time: "8 min away", rating: 4.5, womenOnly: false },
    { id: 4, driver: "Sneha L.", type: "Scooty", seats: 1, price: 15, time: "4 min away", rating: 4.7, womenOnly: true },
    { id: 5, driver: "Vikram R.", type: "Car Pool", seats: 2, price: 40, time: "10 min away", rating: 4.6, womenOnly: false },
];

export default function VehiclePooling() {
    const [isWomenOnly, setIsWomenOnly] = useState(false);
    const [isDriverMode, setIsDriverMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter Logic
    const filteredRides = MOCK_RIDES.filter(ride => {
        if (isWomenOnly && !ride.womenOnly) return false;
        if (searchQuery && !ride.driver.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${isWomenOnly ? 'bg-pink-50 dark:bg-[#831843]' : 'bg-[#F4FDF7] dark:bg-background'}`}>
            <Navbar
                isWomenOnly={isWomenOnly}
                setIsWomenOnly={setIsWomenOnly}
                isDriverMode={isDriverMode}
                setIsDriverMode={setIsDriverMode}
            />

            <main className="max-w-7xl mx-auto p-4 md:p-8 pt-24 md:pt-32 space-y-8 z-10 relative">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className={`text-4xl font-bold tracking-tight mb-2 ${isWomenOnly ? 'text-pink-900 dark:text-pink-100' : 'text-[#07503E] dark:text-white'}`}>
                            Shared Mobility Pool
                        </h1>
                        <p className={`text-lg ${isWomenOnly ? 'text-pink-800/70 dark:text-pink-200/70' : 'text-[#07503E]/70 dark:text-muted-foreground'}`}>
                            Connect with verified drivers for first & last mile connectivity.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button className="bg-[#07503E] dark:bg-[#2FCE65] text-white dark:text-[#07503E]">
                            Host a Ride
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white dark:bg-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by driver name..."
                            className="pl-10 bg-gray-50 dark:bg-black/20 border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Button variant="outline" className={`border-dashed ${isWomenOnly ? 'bg-pink-50 text-pink-700 border-pink-200' : ''}`} onClick={() => setIsWomenOnly(!isWomenOnly)}>
                            {isWomenOnly ? 'Women Only: ON' : 'Women Only: OFF'}
                        </Button>
                        <Button variant="outline" className="border-dashed">
                            <User className="w-4 h-4 mr-2" /> 2+ Seats
                        </Button>
                        <Button variant="outline" className="border-dashed">
                            <Clock className="w-4 h-4 mr-2" /> &lt; 5 min
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Ride List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRides.length > 0 ? filteredRides.map((ride, idx) => (
                        <motion.div
                            key={ride.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className={`group cursor-pointer border hover:shadow-lg transition-all duration-300 ${isWomenOnly ? 'hover:border-pink-300 dark:hover:border-pink-700' : 'hover:border-[#2FCE65] dark:hover:border-[#2FCE65]'}`}>
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xl">
                                                {ride.womenOnly ? '👩' : '👨'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg dark:text-white">{ride.driver}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <span>⭐ {ride.rating}</span>
                                                    <span>•</span>
                                                    <span>{ride.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={`${isWomenOnly ? 'bg-pink-100 text-pink-700' : 'bg-green-100 text-green-700'}`}>
                                            ₹{ride.price}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-6">
                                        <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" /> {ride.seats} seats
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> {ride.time}
                                        </div>
                                    </div>

                                    <Button className={`w-full font-bold ${isWomenOnly ? 'bg-pink-600 hover:bg-pink-700' : 'bg-[#07503E] hover:bg-[#0a6c54] dark:bg-[#2FCE65] dark:text-[#07503E]'}`}>
                                        Request Ride
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )) : (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            <p>No rides found matching your filters.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
