import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Shield, Zap, ArrowRight, TrendingUp } from "lucide-react";
import HeroCarousel from "../components/HeroCarousel";
import MetroHeroScroll from "../components/MetroHeroScroll";
import Footer from "../components/Footer";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#F8F8F9] font-sans text-[#111439] selection:bg-[#635BFF] selection:text-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-[#F8F8F9]/80 backdrop-blur-md border-b border-[#111439]/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#635BFF] p-2 rounded-lg">
                            <Leaf className="w-6 h-6 text-white fill-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[#111439]">
                            SafarLink
                        </span>
                    </div>

                    <div className="flex items-center gap-8">
                        <SignedIn>
                            <Link to="/dashboard" className="text-sm font-semibold hover:text-[#635BFF] transition-colors">Dashboard</Link>
                            <UserButton />
                        </SignedIn>
                        <SignedOut>
                            <div className="hidden md:flex gap-8 text-sm font-semibold text-[#111439]">
                                <Link to="/sign-in" className="hover:text-[#635BFF] transition-colors">Log in</Link>
                            </div>
                            <Link to="/sign-up" className="px-6 py-2.5 rounded-full bg-[#111439] text-white text-sm font-bold hover:bg-[#1a1f5c] transition shadow-lg shadow-[#111439]/20">
                                Request a Demo
                            </Link>
                        </SignedOut>
                    </div>
                </div>
            </nav>

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
                            <Link to="/dashboard" className="px-8 py-4 rounded-full bg-[#111439] text-white font-bold text-lg hover:bg-[#1a1f5c] transition flex items-center justify-center gap-3 shadow-xl">
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
                            className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111439]/5 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#635BFF]/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="w-16 h-16 bg-[#F8F8F9] rounded-2xl flex items-center justify-center mb-8 border border-[#111439]/5 shadow-sm">
                                <TrendingUp className="w-8 h-8 text-[#635BFF]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#111439] mb-4">Real-time Carbon Tracking</h3>
                            <p className="text-[#111439]/70 leading-relaxed">
                                Automatically calculate the CO2 emissions of every trip. Compare routes not just by time, but by environmental impact.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111439]/5 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB347]/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="w-16 h-16 bg-[#F8F8F9] rounded-2xl flex items-center justify-center mb-8 border border-[#111439]/5 shadow-sm">
                                <Shield className="w-8 h-8 text-[#FFB347]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#111439] mb-4">Certified Safe Rides</h3>
                            <p className="text-[#111439]/70 leading-relaxed">
                                Our Women-Only mode ensures peace of mind. All drivers are verified through our comprehensive 3-step community process.
                            </p>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111439]/5 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="w-16 h-16 bg-[#F8F8F9] rounded-2xl flex items-center justify-center mb-8 border border-[#111439]/5 shadow-sm">
                                <Zap className="w-8 h-8 text-[#00D4FF]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#111439] mb-4">Multi-Modal Integration</h3>
                            <p className="text-[#111439]/70 leading-relaxed">
                                Seamlessly connect bus dropping points to shared autos. One ticket, one journey, zero friction.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* FAQ Section */}
            <section className="py-24 px-6 bg-white dark:bg-background border-t border-[#111439]/5" >
                <div className="max-w-3xl mx-auto">
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
            <section className="py-24 px-6 bg-[#F8F8F9]" >
                <div className="max-w-7xl mx-auto bg-gradient-to-r from-[#111439] to-[#1a1f5c] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to green your routine?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/sign-up" className="px-10 py-5 rounded-full bg-white text-[#111439] font-bold text-lg hover:bg-[#F8F8F9] transition shadow-xl">
                                Get Started for Free
                            </Link>
                        </div>
                    </div>
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-[#635BFF] opacity-50 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00D4FF] opacity-40 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
                </div>
            </section >

            {/* Footer */}
            <Footer />
        </div>
    );
}
