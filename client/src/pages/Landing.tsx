import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Home, Navigation, Users, Search } from "lucide-react";
import HeroCarousel from "../components/HeroCarousel";
import MetroHeroScroll from "../components/MetroHeroScroll";
import Footer from "../components/Footer";
import Dock from "../components/Dock";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import bgImage from "../assets/FAQ.jpeg"
import imgEcoTracking from "../assets/e2e.jpeg"
import imgWomenMode from "../assets/WomenMode.jpeg"
import imgPooling from "../assets/pooling.jpeg"

import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function Landing() {
    const navigate = useNavigate();

    const dockItems = [
        { icon: <Home size={22} />, label: 'Home', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
        { icon: <Navigation size={22} />, label: 'Map', onClick: () => navigate('/dashboard') },
        { icon: <Users size={22} />, label: 'Pooling', onClick: () => navigate('/vehicle-pooling') },
        { icon: <Search size={22} />, label: 'AI Planner', onClick: () => navigate('/ai-planner') },
    ];
    return (
        <div className="min-h-screen bg-[#F8F8F9] font-sans text-[#111439] selection:bg-[#635BFF] selection:text-white">
            {/* Floating React Bits Dock (Top) */}
            {/* <div className="fixed top-2 left-0 right-0 z-50 pointer-events-none">
                <Dock
                    items={dockItems}
                    panelHeight={64}
                    dockHeight={84}
                    distance={120}
                    magnification={70}
                />
            </div> */}

            {/* Top Auth Bar (Minimalist) */}
            <div className="absolute top-4 right-6 z-50 flex items-center gap-4">
                <SignedIn>
                    <Link to="/dashboard" className="text-sm text-white font-semibold hover:text-[#635BFF] transition-colors">Dashboard</Link>
                    <UserButton />
                </SignedIn>
                <SignedOut>
                    <Link to="/sign-in" className="hidden md:block text-sm font-semibold hover:text-[#635BFF] transition-colors">Log in</Link>
                    <Link to="/sign-up" className="px-5 py-2 rounded-full bg-[#111439] text-white text-sm font-bold hover:bg-[#1a1f5c] transition shadow-lg shadow-[#111439]/20">
                        Demo
                    </Link>
                </SignedOut>
            </div>

            {/* Top Branding (Centered) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 pointer-events-auto">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                    <img src="/logo.jpeg" alt="SafarLink Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-3xl font-black tracking-tight text-white drop-shadow-sm">
                    SafarLink
                </span>
            </div>

            {/* Scroll-Driven Metro Animation */}
            <MetroHeroScroll />

            {/* Hero Section */}
            <header className="py-20 md:py-32 px-6 relative overflow-hidden w-full">
                {/* Stripe-like Gradient Blobs */}
                <div className="absolute top-[-10%] right-0 w-[800px] h-[800px] bg-[#B366FF] rounded-full blur-[140px] opacity-40 mix-blend-multiply z-0 pointer-events-none"></div>
                <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-[#FFB347] rounded-full blur-[140px] opacity-40 mix-blend-multiply z-0 pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-[#47B3FF] rounded-full blur-[140px] opacity-40 mix-blend-multiply z-0 pointer-events-none"></div>
                <div className="absolute top-[10%] left-[30%] w-[500px] h-[500px] bg-[#FF7EE4] rounded-full blur-[120px] opacity-30 mix-blend-multiply z-0 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center pt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 text-[#111439] text-sm font-bold mb-8 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#635BFF]"></span>
                            The new standard for carbon-neutral commuting
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-[#111439]">
                            Make your daily <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#635BFF] to-[#00D4FF]">commute count.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-[#111439]/70 mb-10 leading-relaxed max-w-lg">
                            Join the movement towards sustainable urban mobility. Measure, reduce, and offset your carbon footprint with every ride.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/dashboard" className="px-8 py-4 rounded-full bg-[#111439] text-white font-bold text-xl hover:bg-[#1a1f5c] transition flex items-center justify-center gap-3 shadow-xl">
                                Start Commuting <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/sign-up" className="px-8 py-4 rounded-full bg-white text-[#111439] shadow-sm border border-[#111439]/10 font-bold text-lg hover:bg-[#F8F8F9] transition flex items-center justify-center">
                                View Impact Report
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Animated Hero Carousel */}
                        <HeroCarousel />

                        {/* Decorative background element behind card */}
                        <div className="absolute top-10 -right-10 w-full h-full bg-gradient-to-br from-[#635BFF] to-[#00D4FF] rounded-3xl -z-10 opacity-20 transform rotate-6 blur-xl"></div>
                    </motion.div>
                </div>
            </header>

            {/* Metrics Section */}
            <section className="py-24 bg-[#111439] text-white relative overflow-hidden" >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#635BFF] rounded-full blur-[120px] opacity-30 mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00D4FF] rounded-full blur-[120px] opacity-20 mix-blend-screen pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#635BFF]">85%</div>
                            <p className="text-xl font-medium text-white/80">Reduction in Trip Cost</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#635BFF]">12k+</div>
                            <p className="text-xl font-medium text-white/80">Active Green Commuters</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#635BFF]">4.5/5</div>
                            <p className="text-xl font-medium text-white/80">Average User Rating</p>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* Features / Value Prop */}
            <section className="py-32 bg-[#F8F8F9] relative" >
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="text-[#635BFF] font-bold text-lg uppercase tracking-wider">Why SafarLink?</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#111439] mt-4 mb-6">The platform for <br />sustainable connectivity.</h2>
                        <p className="text-xl text-[#111439]/70">We combine technology and community to make every mile greener, closer, and safer.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111439]/5 relative overflow-hidden group flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#635BFF]/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>

                            {/* Full-width Image Header */}
                            <div className="w-full h-48 overflow-hidden">
                                <img src={imgEcoTracking} alt="Eco Tracking" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>

                            {/* Text Content */}
                            <div className="p-8 pt-6 flex-1 flex flex-col">
                                <h3 className="text-2xl font-bold text-[#111439] mb-4">E2E Journey Planning</h3>
                                <p className="text-[#111439]/70 leading-relaxed">
                                    Helps users plan their entire trip from source to destination by suggesting the most efficient route based on time, cost, and available transport options.
                                </p>
                            </div>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111439]/5 relative overflow-hidden group flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB347]/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>

                            {/* Full-width Image Header */}
                            <div className="w-full h-48 overflow-hidden">
                                <img src={imgWomenMode} alt="Women Mode" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>

                            {/* Text Content */}
                            <div className="p-8 pt-6 flex-1 flex flex-col">
                                <h3 className="text-2xl font-bold text-[#111439] mb-4">Women Only Mode</h3>
                                <p className="text-[#111439]/70 leading-relaxed">
                                    A safety-focused feature that connects female users with women drivers or co-passengers, providing a more secure and comfortable travel experience.
                                </p>
                            </div>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111439]/5 relative overflow-hidden group flex flex-col"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>

                            {/* Full-width Image Header */}
                            <div className="w-full h-48 overflow-hidden">
                                <img src={imgPooling} alt="Pooling" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>

                            {/* Text Content */}
                            <div className="p-8 pt-6 flex-1 flex flex-col">
                                <h3 className="text-2xl font-bold text-[#111439] mb-4">Vehicle Pooling</h3>
                                <p className="text-[#111439]/70 leading-relaxed">
                                    Allows multiple users traveling in the same direction to share one vehicle, helping reduce travel costs, traffic congestion, and fuel consumption.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* FAQ Section */}
            <section
                className="py-24 px-6 pb-10 relative bg-cover bg-center bg-no-repeat border-t border-[#111439]/5"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                {/* Overlay to ensure text readability */}
                <div className="absolute inset-0 bg-white/70 dark:bg-[#111439]/80 z-0"></div>

                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <Badge variant="secondary" className="mb-4 bg-[#635BFF]/10 text-[#635BFF] hover:bg-[#635BFF]/20 dark:text-primary">Common Questions</Badge>
                        <h2 className="text-4xl font-bold text-[#111439] dark:text-foreground mb-4">Everything you need to know</h2>
                        <p className="text-[#111439]/60 dark:text-muted-foreground">Can't find the answer you're looking for? Reach out to our customer support team.</p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg text-[#111439] dark:text-foreground">How does EcoPilot calculate the safest route?</AccordionTrigger>
                            <AccordionContent className="text-[#111439]/70 dark:text-muted-foreground">
                                EcoPilot analyzes millions of data points, including accident history, road lighting quality, and real-time community reports, to generate a safety score for every possible route.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-lg text-[#111439] dark:text-foreground">Is the Women-Only mode available everywhere?</AccordionTrigger>
                            <AccordionContent className="text-[#111439]/70 dark:text-muted-foreground">
                                Currently, Women-Only shared autos are available in select metro areas. We are rapidly expanding this service to ensure safe travel for women across all our operational zones.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-lg text-[#111439] dark:text-foreground">How do carbon offsets work?</AccordionTrigger>
                            <AccordionContent className="text-[#111439]/70 dark:text-muted-foreground">
                                For every kilometer you travel using our shared mobility options, we calculate the CO2 saved compared to a private vehicle. You can then use these savings to contribute to verified green projects directly through the app.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="text-lg text-[#111439] dark:text-foreground">Can I schedule rides in advance?</AccordionTrigger>
                            <AccordionContent className="text-[#111439]/70 dark:text-muted-foreground">
                                Yes! You can schedule rides up to 7 days in advance. This helps us ensure driver availability and allows you to plan your weekly commute efficiently.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section >

            {/* CTA Section */}
            {/* <section className="py-24 px-6 bg-[#F8F8F9]" > */}
            {/* <div className="max-w-7xl mx-auto bg-gradient-to-r from-[#111439] to-[#1a1f5c] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl"> */}
            {/* <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to green your routine?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/sign-up" className="px-10 py-5 rounded-full bg-white text-[#111439] font-bold text-lg hover:bg-[#F8F8F9] transition shadow-xl">
                                Get Started for Free
                            </Link>
                        </div>
                    </div> */}
            {/* Decorative Blobs */}
            {/* <div className="absolute top-0 left-0 w-64 h-64 bg-[#635BFF] opacity-50 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00D4FF] opacity-40 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
                </div> */}
            {/* </section > */}

            {/* Footer */}
            <Footer />
        </div>
    );
}
