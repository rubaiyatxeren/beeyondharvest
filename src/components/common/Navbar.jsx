import React, { useState } from 'react';
import { useCart } from '../providers/CartProvider'; // Correct path
import { useNav } from '../providers/NavProvider'; // Correct path
import { I, ic } from './Icons'; // Correct path

const Navbar = () => {
    const { page, setPage, searchQuery, setSearchQuery } = useNav();
    const cart = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    console.log("Navbar - Current page:", page); // Debug log

    const links = [
        { id: "home", label: "Home", icon: ic.home },
        { id: "shop", label: "Shop", icon: ic.grid },
        { id: "blog", label: "Blog", icon: ic.blog },
        { id: "track", label: "Track", icon: ic.truck },
        { id: "complaint", label: "Support", icon: ic.headset },
        { id: "transfer", label: "BeeTransfer", icon: ic.send },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-3">
                <button onClick={() => setPage("home")} className="flex items-center gap-2.5 btn-bounce flex-shrink-0 mr-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-md">🍯</div>
                    <span className="font-display text-xl font-bold text-stone-900">BeeHarvest</span>
                </button>

                <div className="hidden md:flex items-center gap-1 flex-1">
                    {links.map((l) => (
                        <button key={l.id} onClick={() => setPage(l.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all btn-bounce ${page === l.id || page.startsWith(l.id + ":")
                                ? "bg-amber-50 text-amber-700 font-semibold"
                                : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                                }`}>
                            {l.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {searchOpen ? (
                        <div className="flex items-center gap-2">
                            <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { setPage("shop"); setSearchOpen(false); } }}
                                placeholder="Search honey…" className="w-40 sm:w-52 px-3 py-1.5 rounded-lg border border-amber-200 text-sm bg-amber-50 focus:bg-white transition-all" />
                            <button onClick={() => setSearchOpen(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 btn-bounce">
                                <I d={ic.x} size={16} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 btn-bounce">
                            <I d={ic.search} size={19} />
                        </button>
                    )}

                    <button onClick={() => setPage("cart")} className="relative p-2 rounded-lg text-stone-500 hover:bg-amber-50 btn-bounce">
                        <I d={ic.cart} size={20} />
                        {cart.count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] px-1 flex items-center justify-center">
                                {cart.count > 99 ? "99+" : cart.count}
                            </span>
                        )}
                    </button>

                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 btn-bounce">
                        <I d={menuOpen ? ic.x : ic.menu} size={20} />
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div className="md:hidden border-t border-amber-50 bg-white px-4 py-2 pb-4" style={{ animation: "fadeIn .18s ease" }}>
                    {links.map((l) => (
                        <button key={l.id} onClick={() => { setPage(l.id); setMenuOpen(false); }}
                            className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium mb-1 transition-all ${page === l.id ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-600"
                                }`}>
                            <I d={l.icon} size={17} />{l.label}
                        </button>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
