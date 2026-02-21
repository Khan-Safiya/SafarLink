import { useNavigate } from "react-router-dom";
import { Car, Map, ShieldCheck, Users, Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function ServicesGrid() {
    const navigate = useNavigate();

    const services = [
        {
            title: "Ride Pooling",
            icon: <Users className="w-6 h-6" />,
            desc: "Share rides & save cost",
            path: "/pooling",
            color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        },
        {
            title: "Driver Mode",
            icon: <Car className="w-6 h-6" />,
            desc: "Earn by driving",
            path: "/driver",
            color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        },
        {
            title: "Live Tracking",
            icon: <Map className="w-6 h-6" />,
            desc: "Track active rides",
            path: "/tracking",
            color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        },
        {
            title: "Safety Center",
            icon: <ShieldCheck className="w-6 h-6" />,
            desc: "Emergency tools",
            path: "/tracking", // Linking to tracking page as it has safety features
            color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        },
        {
            title: "AI Route Planner",
            icon: <Bot className="w-6 h-6" />,
            desc: "Natural-language routes",
            path: "/ai-route",
            color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        },
        {
            title: "Shared Auto",
            icon: <Users className="w-6 h-6" />,
            desc: "Fixed routes & fares",
            path: "/shared-auto",
            color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md bg-white dark:bg-card dark:border-white/5`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${service.color}`}>
                        {service.icon}
                    </div>
                    <h3 className="font-bold text-[#111439] dark:text-white">{service.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{service.desc}</p>
                </motion.div>
            ))}
        </div>
    );
}
