import { useNavigate } from "react-router-dom";
import { Car, Map, ShieldCheck, Users, Bot } from "lucide-react";
import { motion } from "framer-motion";
import imgPooling from "../assets/pooling.jpeg";
import imgDrive from "../assets/drive.png";
import imgLiveTrack from "../assets/liveTrack.jpeg";
import imgSafety from "../assets/safety.png";
import imgBot from "../assets/bot.png";
import imgAuto from "../assets/auto.png";

export default function ServicesGrid() {
    const navigate = useNavigate();

    const services = [
        {
            title: "Ride Pooling",
            icon: <Users className="w-6 h-6" />,
            desc: "Share rides & save cost",
            path: "/pooling",
            iconColors: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
            cardHover: "hover:bg-blue-600 hover:border-blue-600 dark:hover:bg-blue-600",
            hoverImage: imgPooling
        },
        {
            title: "Driver Mode",
            icon: <Car className="w-6 h-6" />,
            desc: "Earn by driving",
            path: "/driver",
            iconColors: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
            cardHover: "hover:bg-green-600 hover:border-green-600 dark:hover:bg-green-600",
            hoverImage: imgDrive
        },
        {
            title: "Live Tracking",
            icon: <Map className="w-6 h-6" />,
            desc: "Track active rides",
            path: "/tracking",
            iconColors: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
            cardHover: "hover:bg-purple-600 hover:border-purple-600 dark:hover:bg-purple-600",
            hoverImage: imgLiveTrack
        },
        {
            title: "Safety Center",
            icon: <ShieldCheck className="w-6 h-6" />,
            desc: "Emergency tools",
            path: "/tracking",
            iconColors: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
            cardHover: "hover:bg-red-600 hover:border-red-600 dark:hover:bg-red-600",
            hoverImage: imgSafety
        },
        {
            title: "AI Route Planner",
            icon: <Bot className="w-6 h-6" />,
            desc: "Natural-language routes",
            path: "/ai-route",
            iconColors: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
            cardHover: "hover:bg-indigo-600 hover:border-indigo-600 dark:hover:bg-indigo-600",
            hoverImage: imgBot
        },
        {
            title: "Shared Auto",
            icon: <Users className="w-6 h-6" />,
            desc: "Fixed routes & fares",
            path: "/shared-auto",
            iconColors: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
            cardHover: "hover:bg-amber-500 hover:border-amber-500 dark:hover:bg-amber-500",
            hoverImage: imgAuto
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service, idx) => (
                <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(service.path)}
                    className={`group relative overflow-hidden p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md bg-white dark:bg-card dark:border-white/5 ${service.cardHover}`}
                >
                    <div className="relative w-12 h-12 mb-3">
                        <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300 ${service.iconColors} group-hover:bg-white/20 group-hover:text-white ${service.hoverImage ? 'group-hover:opacity-0 group-hover:scale-75' : ''}`}>
                            {service.icon}
                        </div>
                        {service.hoverImage && (
                            <img
                                src={service.hoverImage}
                                alt={service.title}
                                className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-0 scale-75 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                            />
                        )}
                    </div>
                    <h3 className="relative z-10 font-bold text-[#111439] dark:text-white transition-colors duration-300 group-hover:text-white">{service.title}</h3>
                    <p className="relative z-10 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300 group-hover:text-white/80">{service.desc}</p>
                </motion.div>
            ))}
        </div>
    );
}
