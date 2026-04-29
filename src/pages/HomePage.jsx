import React from 'react';
import Footer from '../components/common/Footer';
import { I, ic } from '../components/common/Icons';
import { ProductCard } from '../components/common/ProductCard';
import { Sk } from '../components/common/Skeleton';
import { useNav } from '../components/providers/NavProvider';
import { useAPI } from '../hooks/useAPI';
import { CDN } from '../utils/helpers';

const HomePage = () => {
    const { setPage } = useNav();
    const { data: rawFeatured, loading: featLoading } = useAPI("/api/products?featured=true&limit=8");
    const { data: rawCategories } = useAPI("/api/categories");
    const featured = rawFeatured?.products || rawFeatured || [];
    const cats = rawCategories?.categories || rawCategories || [];

    return (
        <div>
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 min-h-[540px] flex items-center">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #f59e0b 0%, transparent 60%), radial-gradient(circle at 80% 20%, #d97706 0%, transparent 50%)" }} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div style={{ animation: "slideUp .6s ease" }}>
                        <span className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-amber-500/30">🍯 Pure · Raw · Organic</span>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">Nature's Finest<br /><span className="text-amber-400">Golden Honey</span></h1>
                        <p className="text-stone-300 text-base sm:text-lg leading-relaxed mb-8 max-w-md">Direct from Bangladeshi beekeepers to your table. No additives, no shortcuts — just pure, lab-tested honey at its best.</p>
                        <div className="flex gap-3 flex-wrap">
                            <button onClick={() => setPage("shop")} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 btn-bounce shadow-xl shadow-amber-900/40 transition-colors text-sm">
                                <I d={ic.grid} size={17} stroke="#1a1a1a" /> Shop Now
                            </button>
                            <button onClick={() => setPage("track")} className="border border-stone-600 text-stone-200 hover:bg-stone-700/50 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 btn-bounce transition-colors text-sm">
                                <I d={ic.truck} size={17} stroke="#e5e7eb" /> Track Order
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-center items-center" style={{ animation: "popIn .8s ease" }}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-400 opacity-20 rounded-full blur-3xl scale-150" />
                            <span className="text-[140px] sm:text-[180px] drop-shadow-2xl relative z-10">🍯</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Bar */}
            <div className="bg-amber-500">
                <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[["🍯", "100% Pure", "No Additives"], ["🌿", "Organic", "Lab Tested"], ["🚚", "24–48h", "Fast Delivery"], ["⭐", "50K+", "Happy Customers"]].map(([icon, val, label]) => (
                        <div key={label} className="text-center py-2">
                            <div className="text-2xl">{icon}</div>
                            <div className="font-bold text-stone-900 font-display">{val}</div>
                            <div className="text-xs text-amber-800 font-medium">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Categories Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                <div className="text-center mb-10">
                    <h2 className="font-display text-3xl font-bold text-stone-900 mb-2">Shop by Category</h2>
                    <p className="text-stone-500">Explore our curated honey collection</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {cats.length > 0 ? cats.slice(0, 6).map((cat) => (
                        <div key={cat._id} onClick={() => setPage("shop")} className="card-hover bg-white rounded-2xl border border-stone-100 p-5 text-center cursor-pointer">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl overflow-hidden bg-amber-50 flex items-center justify-center">
                                {CDN(cat.image) ? <img src={CDN(cat.image)} alt={cat.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🍯</span>}
                            </div>
                            <div className="font-semibold text-stone-800 text-sm">{cat.name}</div>
                            {cat.productCount > 0 && <div className="text-xs text-stone-400 mt-0.5">{cat.productCount} items</div>}
                        </div>
                    )) : Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5">
                            <Sk className="w-14 h-14 mx-auto mb-3" />
                            <Sk className="h-3 w-3/4 mx-auto" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Featured Products */}
            <div className="bg-stone-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h2 className="font-display text-3xl font-bold text-stone-900 mb-1">Featured Products</h2>
                            <p className="text-stone-500">Handpicked bestsellers</p>
                        </div>
                        <button onClick={() => setPage("shop")} className="text-amber-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all btn-bounce">
                            View All <I d={ic.chev_r} size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featLoading ? Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                                <Sk className="h-48 rounded-none" />
                                <div className="p-4 space-y-2">
                                    <Sk className="h-3 w-1/3" />
                                    <Sk className="h-4" />
                                    <Sk className="h-3 w-1/2" />
                                </div>
                            </div>
                        )) : featured.slice(0, 8).map((p) => (
                            <ProductCard key={p._id} product={p} onView={() => setPage(`product:${p._id}`)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Why Choose Us */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                <h2 className="font-display text-3xl font-bold text-stone-900 text-center mb-10">Why BeeHarvest?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[["🌿", "100% Organic", "No artificial additives, preservatives, or flavoring — ever."],
                    ["🔬", "Lab Tested", "Every batch independently tested for purity & quality."],
                    ["🚚", "Fast Delivery", "Nationwide delivery within 24–48 hours."],
                    ["💰", "Best Price", "Direct from beekeepers — no middlemen markup."]
                    ].map(([icon, title, desc]) => (
                        <div key={title} className="bg-white rounded-2xl border border-stone-100 p-6 text-center card-hover">
                            <div className="text-4xl mb-4">{icon}</div>
                            <h3 className="font-display font-semibold text-stone-800 text-base mb-2">{title}</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Promo Banner */}
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 py-16 text-center">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="text-5xl mb-4">🎁</div>
                    <h2 className="font-display text-3xl font-bold text-stone-900 mb-3">First Order? Save 10%!</h2>
                    <p className="text-amber-900/80 mb-6">Use code <strong className="bg-white/40 px-2 py-0.5 rounded-lg">WELCOME10</strong> at checkout</p>
                    <button onClick={() => setPage("shop")} className="bg-stone-900 text-white font-bold px-8 py-3.5 rounded-xl btn-bounce hover:bg-stone-800 transition-colors shadow-xl text-sm">
                        Start Shopping →
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default HomePage;