

export default function Footer() {
    return (
        <footer className="bg-[#111439] text-white py-16 border-t border-white/10 dark:border-border mt-auto">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-white/10 p-0.5">
                            <img src="/logo.jpeg" alt="SafarLink Logo" className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">SafarLink</span>
                    </div>
                    <p className="text-white/60 max-w-sm mb-8">
                        Empowering communities with sustainable, safe, and efficient last-mile connectivity solutions.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Icons Placeholder */}
                        <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#635BFF] transition cursor-pointer flex items-center justify-center">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#635BFF] transition cursor-pointer flex items-center justify-center">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Platform</h4>
                    <ul className="space-y-4 text-white/60">
                        <li><a href="#" className="hover:text-white transition">Dashboard</a></li>
                        <li><a href="#" className="hover:text-white transition">For Drivers</a></li>
                        <li><a href="#" className="hover:text-white transition">Route Planner</a></li>
                        <li><a href="#" className="hover:text-white transition">Carbon Calculator</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Company</h4>
                    <ul className="space-y-4 text-white/60">
                        <li><a href="#" className="hover:text-white transition">About Us</a></li>
                        <li><a href="#" className="hover:text-white transition">Sustainability</a></li>
                        <li><a href="#" className="hover:text-white transition">Careers</a></li>
                        <li><a href="#" className="hover:text-white transition">Contact</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
}
