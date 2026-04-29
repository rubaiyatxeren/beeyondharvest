import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-stone-900 text-stone-300 py-12 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <div>
                    <div className="font-display text-xl font-bold text-white mb-3">🍯 BeeHarvest</div>
                    <p className="text-sm leading-relaxed text-stone-400">Pure honey, straight from the hive. Trusted by 50,000+ customers across Bangladesh.</p>
                </div>

                <div>
                    <div className="font-semibold text-white mb-3 text-sm">Quick Links</div>
                    {["Home", "Shop", "Blog", "Track Order", "Contact"].map((l) => (
                        <div key={l} className="text-stone-400 text-sm mb-2 cursor-pointer hover:text-amber-400 transition-colors">{l}</div>
                    ))}
                </div>

                <div>
                    <div className="font-semibold text-white mb-3 text-sm">Policies</div>
                    {["Returns", "Shipping", "Privacy Policy", "Terms of Service"].map((l) => (
                        <div key={l} className="text-stone-400 text-sm mb-2 cursor-pointer hover:text-amber-400 transition-colors">{l}</div>
                    ))}
                </div>

                <div>
                    <div className="font-semibold text-white mb-3 text-sm">Contact</div>
                    <div className="text-stone-400 text-sm mb-2">📧 info@beeharvest.com</div>
                    <div className="text-stone-400 text-sm mb-2">📞 01XXXXXXXXX</div>
                    <div className="text-stone-400 text-sm mb-2">📍 Dhaka, Bangladesh</div>
                </div>
            </div>
            <div className="border-t border-stone-800 pt-6 text-center text-stone-500 text-xs">
                © 2024 BeeHarvest. All rights reserved. Made with 🍯 in Bangladesh.
            </div>
        </footer>
    );
};

export default Footer;