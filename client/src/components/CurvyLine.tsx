
export default function CurvyLine({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 100 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            <path
                d="M 20 0 C 20 80, 80 80, 80 100 C 80 120, 20 120, 20 200"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
                className="dark:stroke-blue-400"
            />
        </svg>
    );
}
