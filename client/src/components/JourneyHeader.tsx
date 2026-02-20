import { Button } from "@/components/ui/button";
import { ArrowRightLeft, MapPin } from "lucide-react";
import LocationInput from "./LocationInput";
import { motion } from "framer-motion";

interface JourneyHeaderProps {
    from: string;
    setFrom: (value: string) => void;
    to: string;
    setTo: (value: string) => void;
    onSwap: () => void;
    isLoaded: boolean;
    setFromCoords: (coords: { lat: number; lng: number }) => void;
    setToCoords: (coords: { lat: number; lng: number }) => void;
    onSearch: () => void;
    loading: boolean;
}

export default function JourneyHeader({
    from,
    setFrom,
    to,
    setTo,
    onSwap,
    isLoaded,
    setFromCoords,
    setToCoords,
    onSearch,
    loading
}: JourneyHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card border-b border-gray-100 dark:border-border sticky top-20 z-40 shadow-sm"
        >
            <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* From Input */}
                    <div className="flex-1 w-full relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                            <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></div>
                        </div>
                        {isLoaded ? (
                            <LocationInput
                                placeholder="Starting Point"
                                value={from}
                                onChange={setFrom}
                                onPlaceSelected={(place) => {
                                    if (place.geometry?.location) setFromCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                                }}
                                className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-black/20 border-transparent focus:bg-white dark:focus:bg-black/40 transition-colors rounded-xl font-medium"
                                icon={null} />
                        ) : <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />}
                    </div>

                    {/* Swap Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSwap}
                        className="rounded-full hover:bg-gray-100 dark:hover:bg-white/10 shrink-0 rotate-90 md:rotate-0"
                    >
                        <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                    </Button>

                    {/* To Input */}
                    <div className="flex-1 w-full relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500">
                            <MapPin className="w-5 h-5 fill-green-500/20" />
                        </div>
                        {isLoaded ? (
                            <LocationInput
                                placeholder="Destination"
                                value={to}
                                onChange={setTo}
                                onPlaceSelected={(place) => {
                                    if (place.geometry?.location) setToCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border-transparent focus:bg-white dark:focus:bg-black/40 transition-colors rounded-xl font-medium"
                                icon={null} />
                        ) : <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />}
                    </div>

                    {/* Search Button */}
                    <Button
                        onClick={onSearch}
                        disabled={loading}
                        className="w-full md:w-auto px-8 py-6 rounded-xl font-bold text-white bg-[#07503E] hover:bg-[#0a6c54] dark:bg-[#2FCE65] dark:text-[#07503E] dark:hover:bg-[#25a953] shadow-lg shadow-[#2FCE65]/20 hover:shadow-xl transition-all active:scale-95"
                    >
                        {loading ? 'Routing...' : 'Compare Routes'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
