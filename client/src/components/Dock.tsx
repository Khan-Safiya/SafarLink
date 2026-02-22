import React, {
    forwardRef,
    useRef,
    useState,
} from 'react';
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    AnimatePresence
} from 'motion/react';
import './Dock.css';

interface DockItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    className?: string;
    mouseX: any;
    springConfig: {
        stiffness: number;
        damping: number;
        mass: number;
    };
    magnification: number;
    distance: number;
    panelHeight: number;
}

const DockItem = ({
    icon,
    label,
    onClick,
    className,
    mouseX,
    springConfig,
    magnification,
    distance,
    panelHeight
}: DockItemProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const distanceCalc = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() || { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthTransform = useTransform(
        distanceCalc,
        [-distance, 0, distance],
        [40, magnification, 40]
    );

    const width = useSpring(widthTransform, springConfig);

    return (
        <motion.div
            ref={ref}
            style={{ width }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            className={`dock-item ${className || ''}`}
        >
            <div className="dock-item-content">{icon}</div>
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, x: '-50%' }}
                        animate={{ opacity: 1, y: 40, x: '-50%' }}
                        exit={{ opacity: 0, y: -10, x: '-50%' }}
                        className="dock-tooltip"
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

interface DockProps {
    items: Array<{
        icon: React.ReactNode;
        label: string;
        onClick?: () => void;
        className?: string;
    }>;
    className?: string;
    distance?: number;
    magnification?: number;
    springConfig?: {
        stiffness: number;
        damping: number;
        mass: number;
    };
    panelHeight?: number;
    dockHeight?: number;
}

const Dock = forwardRef<HTMLDivElement, DockProps>(
    (
        {
            items,
            className,
            distance = 150,
            magnification = 80,
            springConfig = { stiffness: 150, damping: 20, mass: 0.1 },
            panelHeight = 64,
            dockHeight = 84
        },
        ref
    ) => {
        const mouseX = useMotionValue(Infinity);

        return (
            <motion.div
                ref={ref}
                onMouseMove={(e) => mouseX.set(e.pageX)}
                onMouseLeave={() => mouseX.set(Infinity)}
                style={{ height: dockHeight }}
                className={`dock-container ${className || ''}`}
            >
                <motion.div
                    style={{ height: panelHeight }}
                    className="dock-panel"
                >
                    {items.map((item, index) => (
                        <DockItem
                            key={index}
                            mouseX={mouseX}
                            springConfig={springConfig}
                            magnification={magnification}
                            distance={distance}
                            panelHeight={panelHeight}
                            {...item}
                        />
                    ))}
                </motion.div>
            </motion.div>
        );
    }
);

Dock.displayName = 'Dock';

export default Dock;
