import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
    {
        url: "/metro.png",
        alt: "Modern Metro",
        caption: "Smart Metro Integration"
    },
    {
        url: "/bus.png",
        alt: "Electric Bus",
        caption: "Eco-Friendly Buses"
    },
    {
        url: "/auto.png",
        alt: "City Transit",
        caption: "Connected Urban Mobility"
    }
];

export default function HeroCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img
                        src={images[currentIndex].url}
                        alt={images[currentIndex].alt}
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Caption */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-8 left-8 text-white"
                    >
                        <h3 className="text-2xl font-bold mb-2">{images[currentIndex].caption}</h3>
                        <div className="flex gap-2">
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#2FCE65]' : 'w-2 bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
