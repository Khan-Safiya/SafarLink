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
        <div className="min-h-screen bg-white font-sans text-[#07503E] selection:bg-[#2FCE65] selection:text-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-[#07503E]/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#2FCE65] p-2 rounded-lg">
                            <Leaf className="w-6 h-6 text-white fill-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[#07503E]">
                            SafarLink
                        </span>
                    </div>

                    <div className="flex items-center gap-8">
                        <SignedIn>
                            <Link to="/dashboard" className="text-sm font-semibold hover:text-[#2FCE65] transition-colors">Dashboard</Link>
                            <UserButton />
                        </SignedIn>
                        <SignedOut>
                            <div className="hidden md:flex gap-8 text-sm font-semibold text-[#07503E]">
                                <Link to="/sign-in" className="hover:text-[#2FCE65] transition-colors">Log in</Link>
                            </div>
                            <Link to="/sign-up" className="px-6 py-2.5 rounded-full bg-[#2FCE65] text-white text-sm font-bold hover:bg-[#25a852] transition shadow-lg shadow-[#2FCE65]/20">
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
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] bg-[#2FCE65]/5 rounded-full blur-3xl opacity-50 z-0"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-[#2FCE65]/10 rounded-full blur-3xl opacity-50 z-0"></div>

                <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8FAEF] text-[#07503E] text-sm font-bold mb-8">
                            <span className="w-2 h-2 rounded-full bg-[#2FCE65]"></span>
                            The new standard for carbon-neutral commuting
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-[#07503E]">
                            Make your daily <br />
                            <span className="text-[#2FCE65]">commute count.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-[#07503E]/70 mb-10 leading-relaxed max-w-lg">
                            Join the movement towards sustainable urban mobility. Measure, reduce, and offset your carbon footprint with every ride.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/dashboard" className="px-8 py-4 rounded-full bg-[#07503E] text-white font-bold text-lg hover:bg-[#053a2d] transition flex items-center justify-center gap-3 shadow-xl">
                                Start Commuting <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/sign-up" className="px-8 py-4 rounded-full bg-white text-[#07503E] border border-[#07503E]/20 font-bold text-lg hover:bg-[#E8FAEF] transition flex items-center justify-center">
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
                        <div className="absolute top-10 -right-10 w-full h-full bg-[#2FCE65] rounded-3xl -z-10 opacity-20 transform rotate-6"></div>
                    </motion.div>
                </div>
            </header>

            {/* Metrics Section */}
            <section className="py-24 bg-[#07503E] text-white" >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="text-6xl font-bold mb-4 text-[#2FCE65]">85%</div>
                            <p className="text-xl font-medium opacity-80">Reduction in Trip Cost</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="text-6xl font-bold mb-4 text-[#2FCE65]">12k+</div>
                            <p className="text-xl font-medium opacity-80">Active Green Commuters</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="text-6xl font-bold mb-4 text-[#2FCE65]">4.5/5</div>
                            <p className="text-xl font-medium opacity-80">Average User Rating</p>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* Features / Value Prop */}
            <section className="py-32 bg-[#F9FEFB]" >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="text-[#2FCE65] font-bold text-lg uppercase tracking-wider">Why SafarLink?</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#07503E] mt-4 mb-6">The platform for <br />sustainable connectivity.</h2>
                        <p className="text-xl text-[#07503E]/70">We combine technology and community to make every mile greener, closer, and safer.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#07503E]/5"
                        >
                            <div className="w-16 h-16 bg-[#E8FAEF] rounded-2xl flex items-center justify-center mb-8">
                                <TrendingUp className="w-8 h-8 text-[#2FCE65]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#07503E] mb-4">Real-time Carbon Tracking</h3>
                            <p className="text-[#07503E]/70 leading-relaxed">
                                Automatically calculate the CO2 emissions of every trip. Compare routes not just by time, but by environmental impact.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#07503E]/5"
                        >
                            <div className="w-16 h-16 bg-[#E8FAEF] rounded-2xl flex items-center justify-center mb-8">
                                <Shield className="w-8 h-8 text-[#2FCE65]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#07503E] mb-4">Certified Safe Rides</h3>
                            <p className="text-[#07503E]/70 leading-relaxed">
                                Our Women-Only mode ensures peace of mind. All drivers are verified through our comprehensive 3-step community process.
                            </p>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-[#07503E]/5"
                        >
                            <div className="w-16 h-16 bg-[#E8FAEF] rounded-2xl flex items-center justify-center mb-8">
                                <Zap className="w-8 h-8 text-[#2FCE65]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#07503E] mb-4">Multi-Modal Integration</h3>
                            <p className="text-[#07503E]/70 leading-relaxed">
                                Seamlessly connect bus dropping points to shared autos. One ticket, one journey, zero friction.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section >



            {/* FAQ Section (Adds Bulk) */}
            <section className="py-24 px-6 bg-white dark:bg-background" >
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge variant="secondary" className="mb-4 bg-[#2FCE65]/10 text-[#07503E] dark:text-primary">Common Questions</Badge>
                        <h2 className="text-4xl font-bold text-[#07503E] dark:text-foreground mb-4">Everything you need to know</h2>
                        <p className="text-[#07503E]/60 dark:text-muted-foreground">Can't find the answer you're looking for? Reach out to our customer support team.</p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg text-[#07503E] dark:text-foreground">How does EcoPilot calculate the safest route?</AccordionTrigger>
                            <AccordionContent className="text-[#07503E]/70 dark:text-muted-foreground">
                                EcoPilot analyzes millions of data points, including accident history, road lighting quality, and real-time community reports, to generate a safety score for every possible route.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="text-lg text-[#07503E] dark:text-foreground">Is the Women-Only mode available everywhere?</AccordionTrigger>
                            <AccordionContent className="text-[#07503E]/70 dark:text-muted-foreground">
                                Currently, Women-Only shared autos are available in select metro areas. We are rapidly expanding this service to ensure safe travel for women across all our operational zones.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="text-lg text-[#07503E] dark:text-foreground">How do carbon offsets work?</AccordionTrigger>
                            <AccordionContent className="text-[#07503E]/70 dark:text-muted-foreground">
                                For every kilometer you travel using our shared mobility options, we calculate the CO2 saved compared to a private vehicle. You can then use these savings to contribute to verified green projects directly through the app.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="text-lg text-[#07503E] dark:text-foreground">Can I schedule rides in advance?</AccordionTrigger>
                            <AccordionContent className="text-[#07503E]/70 dark:text-muted-foreground">
                                Yes! You can schedule rides up to 7 days in advance. This helps us ensure driver availability and allows you to plan your weekly commute efficiently.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section >

            {/* CTA Section */}
            <section className="py-24 px-6" >
                <div className="max-w-7xl mx-auto bg-[#2FCE65] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#07503E] mb-8">Ready to green your routine?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/sign-up" className="px-10 py-5 rounded-full bg-[#07503E] text-white font-bold text-lg hover:bg-white hover:text-[#07503E] transition shadow-xl">
                                Get Started for Free
                            </Link>
                        </div>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#07503E] opacity-10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
                </div>
            </section >

            {/* Footer */}
            <Footer />
        </div>
    );
}
