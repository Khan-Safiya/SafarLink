import { UserButton } from "@clerk/clerk-react";
import ThemeToggle from "./ThemeToggle";
import { Users, Bot, TrendingUp, Home, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Dock from "./Dock";

interface NavbarProps {
    isWomenOnly: boolean;
    setIsWomenOnly: (value: boolean) => void;
    isDriverMode: boolean;
    setIsDriverMode: (value: boolean) => void;
}

export default function Navbar({ isWomenOnly, setIsWomenOnly, isDriverMode, setIsDriverMode }: NavbarProps) {
    const navigate = useNavigate();

    const dockItems = [
        { icon: <Home size={20} />, label: 'Home', onClick: () => navigate('/dashboard') },
        { icon: <Users size={20} />, label: 'Ride Pooling', onClick: () => navigate('/vehicle-pooling') },
        { icon: <TrendingUp size={20} />, label: 'Shared Auto', onClick: () => navigate('/shared-auto') },
        { icon: <Bot size={20} />, label: 'AI Route Planner', onClick: () => navigate('/ai-planner') },
        { icon: <MessageSquare size={20} />, label: 'Feedback Wall', onClick: () => navigate('/feedback-wall') },
    ];

    return (
        <nav className="relative mx-6 mt-6 rounded-2xl px-6 py-4 flex items-center justify-between bg-transparent dark:bg-[#111439]/80 dark:border-white/10 z-50 transition-colors duration-300">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                    <img src="/logo.jpeg" alt="SafarLink Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#111439] dark:text-white">
                    SafarLink
                </span>
            </div>

            {/* Center: Dock Navigation */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex w-full justify-center">
                <Dock
                    items={dockItems}
                    panelHeight={52}
                    dockHeight={60}
                    distance={100}
                    magnification={60}
                />
            </div>

            {/* Right: Icons & Toggles */}
            <div className="flex items-center gap-4 relative z-10">
                {/* Women Only Toggle */}
                <button
                    onClick={() => setIsWomenOnly(!isWomenOnly)}
                    title="Women Only Mode"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isWomenOnly
                        ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20'
                        : 'bg-[#F8F8F9] dark:bg-white/5 text-[#111439] dark:text-gray-300 border-transparent hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600'
                        }`}
                >
                    <span>WOMEN ONLY</span>
                    <div className={`w-2 h-2 rounded-full ${isWomenOnly ? 'bg-white' : 'bg-pink-500'}`} />
                </button>

                {/* Driver Mode Toggle - Links to Dashboard */}
                <Link to="/driver">
                    <button
                        onClick={() => setIsDriverMode(!isDriverMode)}
                        title="Driver Mode"
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isDriverMode
                            ? 'bg-[#635BFF] text-white border-[#635BFF] shadow-md shadow-blue-500/20'
                            : 'bg-[#F8F8F9] dark:bg-white/5 text-[#111439] dark:text-gray-300 border-transparent hover:bg-[#635BFF] hover:text-white'
                            }`}
                    >
                        <span>DRIVER</span>
                        <div className={`w-2 h-2 rounded-full ${isDriverMode ? 'bg-[#111439]' : 'bg-[#635BFF]'}`} />
                    </button>
                </Link>

                <div className="h-6 w-px bg-[#111439]/10 dark:bg-white/10 mx-2"></div>

                <ThemeToggle />

                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "w-9 h-9 border-2 border-white dark:border-gray-700 shadow-sm"
                        }
                    }}
                />
            </div>
        </nav>
    );
}
