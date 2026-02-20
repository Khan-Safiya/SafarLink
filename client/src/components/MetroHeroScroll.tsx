import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const frameCount = 80;

// Helper to generate image URLs
const currentFrame = (index: number) => {
    // Pad index to 3 digits (000, 001, ... 079)
    const paddedIndex = index.toString().padStart(3, '0');
    return new URL(`../assets/Hero_metro_animation/Create_a_smooth_1080p_202602191711_${paddedIndex}.jpg`, import.meta.url).href;
};

export default function MetroHeroScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Track scroll progress of the container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Transform scroll progress (0-1) to frame index (0-79)
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

    // Preload images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages: HTMLImageElement[] = [];
            const promises = [];

            for (let i = 0; i < frameCount; i++) {
                const promise = new Promise<void>((resolve) => {
                    const img = new Image();
                    img.src = currentFrame(i);
                    img.onload = () => {
                        loadedImages[i] = img;
                        resolve();
                    };
                    // Handle potential errors (e.g., missing frame)
                    img.onerror = () => {
                        console.warn(`Failed to load frame ${i}`);
                        resolve();
                    }
                });
                promises.push(promise);
            }

            await Promise.all(promises);
            setImages(loadedImages);
            setIsLoaded(true);
        };

        loadImages();
    }, []);

    // Bender loop using requestAnimationFrame
    useEffect(() => {
        if (!isLoaded || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Initial render
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const render = () => {
            const index = Math.min(
                frameCount - 1,
                Math.max(0, Math.floor(frameIndex.get()))
            );

            const img = images[index];
            if (img) {
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Draw image "cover" style
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;

                context.drawImage(img, x, y, img.width * scale, img.height * scale);
            }

            requestAnimationFrame(render);
        };

        const unsubscribe = frameIndex.on("change", () => {
            // We can just rely on rAF loop or trigger here. 
            // Using rAF loop is often smoother for canvas updates.
        });

        // Start loop
        const animationId = requestAnimationFrame(render);

        // Handle resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            unsubscribe();
        };
    }, [isLoaded, frameIndex, images]);


    return (
        <div ref={containerRef} className="relative h-[200vh] bg-black">
            <div className="sticky top-0 h-screen w-full overflow-hidden z-0">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover"
                />

                {/* Optional Overlay: Gradient or Text if needed */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }}
                        className="text-center"
                    >
                        <h2 className="text-6xl md:text-8xl font-bold tracking-tight mb-4 drop-shadow-2xl">
                            <span className="text-[#2FCE65]">Let's connect</span> <span className="text-[#07503E]">homes</span> <span className="text-[#2FCE65]">to</span> <span className="text-[#07503E]">metro</span>
                        </h2>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
