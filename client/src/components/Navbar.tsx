import { UserButton } from "@clerk/clerk-react";
import ThemeToggle from "./ThemeToggle";
import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

interface NavbarProps {
    isWomenOnly: boolean;
    setIsWomenOnly: (value: boolean) => void;
    isDriverMode: boolean;
    setIsDriverMode: (value: boolean) => void;
}

export default function Navbar({ isWomenOnly, setIsWomenOnly, isDriverMode, setIsDriverMode }: NavbarProps) {
    return (
        <nav className="mx-6 mt-6 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm bg-white/80 dark:bg-[#022c22]/80 backdrop-blur-xl border border-[#07503E]/5 dark:border-white/10 z-50 transition-colors duration-300">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#2FCE65]">
                    <Leaf className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#07503E] dark:text-white">
                    SafarLink
                </span>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
                {["HOME", "RIDES", "HISTORY", "SUPPORT"].map((item) => (
                    <a
                        key={item}
                        href="#"
                        className="text-xs font-bold tracking-wider text-[#07503E] dark:text-gray-300 hover:text-[#2FCE65] dark:hover:text-[#2FCE65] transition-colors"
                    >
                        {item}
                    </a>
                ))}
            </div>

            {/* Right: Icons & Toggles */}
            <div className="flex items-center gap-4">
                {/* Women Only Toggle */}
                <button
                    onClick={() => setIsWomenOnly(!isWomenOnly)}
                    title="Women Only Mode"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isWomenOnly
                        ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20'
                        : 'bg-[#F4FDF7] dark:bg-white/5 text-[#07503E] dark:text-gray-300 border-transparent hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600'
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
                            ? 'bg-[#2FCE65] text-[#07503E] border-[#2FCE65] shadow-md shadow-green-500/20'
                            : 'bg-[#F4FDF7] dark:bg-white/5 text-[#07503E] dark:text-gray-300 border-transparent hover:bg-[#2FCE65] hover:text-[#07503E]'
                            }`}
                    >
                        <span>DRIVER</span>
                        <div className={`w-2 h-2 rounded-full ${isDriverMode ? 'bg-[#07503E]' : 'bg-[#2FCE65]'}`} />
                    </button>
                </Link>

                <div className="h-6 w-px bg-[#07503E]/10 dark:bg-white/10 mx-2"></div>

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
