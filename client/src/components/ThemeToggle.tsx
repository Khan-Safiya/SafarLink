import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
        p-2 rounded-full transition-all duration-300 ease-in-out
        ${theme === 'dark' ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100 shadow-sm border border-gray-200'}
      `}
            aria-label="Toggle Dark Mode"
        >
            {theme === 'dark' ? (
                <Moon className="w-5 h-5 transition-transform hover:rotate-12" />
            ) : (
                <Sun className="w-5 h-5 transition-transform hover:rotate-90" />
            )}
        </button>
    );
}
