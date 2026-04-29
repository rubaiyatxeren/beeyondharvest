import React, { useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Sk } from '../components/common/Skeleton';
import { Stars } from '../components/common/Stars';
import { useCart } from '../components/providers/CartProvider';
import { useNav } from '../components/providers/NavProvider';
import { useToast } from '../components/providers/ToastProvider';
import { useAPI } from '../hooks/useAPI';
import { CDN, fmt } from '../utils/helpers';

const ProductPage = ({ productId }) => {
    const { setPage } = useNav();
    const { data: raw, loading } = useAPI(`/api/products/${productId}`);
    const { data: rawReviews } = useAPI(`/api/reviews/product/${productId}`);
    const cart = useCart();
    const toast = useToast();
    const [qty, setQty] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [tab, setTab] = useState("description");

    const p = raw?.product || raw;
    const reviews = rawReviews?.reviews || rawReviews || [];

    if (loading) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Sk className="h-96" />
                <div className="space-y-4">
                    <Sk className="h-8 w-3/4" />
                    <Sk className="h-5 w-1/2" />
                    <Sk className="h-24" />
                    <Sk className="h-12" />
                </div>
            </div>
        </div>
    );

    if (!p) return <div className="text-center py-20 text-stone-500">Product not found.</div>;

    const images = p.images || [];
    const disc = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ animation: "fadeIn .3s ease" }}>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-8 flex-wrap">
                <button onClick={() => setPage("home")} className="hover:text-amber-600 transition-colors font-medium">Home</button>
                <I d={ic.chev_r} size={12} />
                <button onClick={() => setPage("shop")} className="hover:text-amber-600 transition-colors font-medium">Shop</button>
                <I d={ic.chev_r} size={12} />
                <span className="text-stone-600 font-medium line-clamp-1">{p.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                {/* Product Images */}
                <div>
                    <div className="bg-amber-50 rounded-2xl overflow-hidden h-80 md:h-96 flex items-center justify-center mb-3 ">
                        {images[activeImg] ? (
                            <img src={CDN(images[activeImg])} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-9xl">🍯</span>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => setActiveImg(i)}
                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all btn-bounce ${activeImg === i ? "border-amber-500" : "border-transparent"
                                        }`}>
                                    <img src={CDN(img)} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        {p.category?.name || "Honey"}
                    </span>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-3 leading-tight">{p.name}</h1>
                    <div className="mb-5">
                        {/* Main rating section with emotional appeal */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <Stars rating={p.ratings?.average || p.avgRating || 0} size={20} />

                                <div className="relative group">
                                    {/* Animated rating badge */}
                                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                                        <span className="text-white text-sm animate-pulse">★</span>
                                        <span className="font-bold text-white text-base">
                                            {(p.ratings?.average || p.avgRating || 0).toFixed(1)}
                                        </span>
                                        <span className="text-amber-200 text-xs">/ 5.0</span>
                                    </div>

                                    {/* Magical tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white rounded-xl shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 border border-amber-100">
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">✨</div>
                                            <p className="text-xs text-stone-600 font-medium">
                                                {((p.ratings?.average || p.avgRating || 0) * 20) > 80 ? '⭐ Loved by customers' :
                                                    ((p.ratings?.average || p.avgRating || 0) * 20) > 60 ? '👍 Highly recommended' : '💫 Customer approved'}
                                            </p>
                                            <p className="text-[10px] text-stone-400 mt-1">
                                                Based on verified purchases
                                            </p>
                                        </div>
                                        {/* Tooltip arrow */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-amber-100"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Love meter / satisfaction score */}
                            {((p.reviewCount || p.ratings?.count || reviews.length) > 0) && (
                                <div className="flex items-center gap-2 bg-gradient-to-r from-rose-50 to-amber-50 px-3 py-1.5 rounded-full">
                                    <span className="text-rose-500 text-sm animate-pulse">❤️</span>
                                    <span className="text-xs font-semibold text-stone-700">
                                        {Math.round(((p.ratings?.average || p.avgRating || 0) / 5) * 100)}% Love This
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Reviews count with emotional trigger */}
                        <div className="flex items-center gap-2 mt-2 ml-1">
                            <button
                                onClick={() => setTab("reviews")}
                                className="group flex items-center gap-1.5"
                            >
                                <span className="text-amber-500 text-sm transition-transform group-hover:scale-110">💬</span>
                                <span className="text-stone-500 text-xs group-hover:text-amber-600 transition-colors">
                                    {p.reviewCount || p.ratings?.count || reviews.length}
                                </span>
                                <span className="text-stone-400 text-xs">
                                    {p.reviewCount === 1 ? 'happy customer ' : 'happy customers'}
                                </span>
                            </button>

                            {/* Trust indicator */}
                            <div className="w-1 h-1 rounded-full bg-stone-300"></div>
                            <div className="flex items-center gap-1">
                                <span className="text-emerald-500 text-xs">✓</span>
                                <span className="text-stone-400 text-[10px]">100% verified</span>
                            </div>
                        </div>

                        {/* Customer quote/trust badge - only when enough reviews */}
                        {((p.reviewCount || p.ratings?.count || reviews.length) >= 10) && (
                            <div className="mt-3 bg-amber-50/50 rounded-xl p-2.5 border border-amber-100/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏆</span>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-semibold text-stone-700">
                                            Trusted Choice
                                        </p>
                                        <p className="text-[10px] text-stone-500">
                                            {p.reviewCount || p.ratings?.count || reviews.length}+ customers can't be wrong
                                        </p>
                                    </div>
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="text-amber-400 text-xs">★</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-baseline gap-3 mb-5">
                        <span className="text-3xl font-bold text-stone-900">{fmt(p.price)}</span>
                        {disc > 0 && (
                            <>
                                <span className="text-stone-400 line-through text-lg">{fmt(p.originalPrice)}</span>
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">Save {disc}%</span>
                            </>
                        )}
                    </div>
                    <p className="text-stone-600 leading-relaxed mb-5 text-sm">{p.description || "Premium quality honey, pure and natural."}</p>

                    <div className="mb-5">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${p.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                            <span>{p.stock > 0 ? "✓" : "✗"}</span>
                            {p.stock > 0 ? `In Stock (${p.stock} available)` : "Out of Stock"}
                        </span>
                        {p.sku && <span className="ml-3 text-xs text-stone-400">SKU: {p.sku}</span>}
                    </div>

                    {p.stock > 0 && (
                        <div className="flex gap-3 mb-6 flex-wrap">
                            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                                <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600">
                                    <I d={ic.minus} size={15} />
                                </button>
                                <span className="w-12 text-center font-bold text-stone-900">{qty}</span>
                                <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))}
                                    className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600">
                                    <I d={ic.plus} size={15} />
                                </button>
                            </div>
                            <button onClick={() => { cart.add(p, qty); toast(`${qty}× ${p.name} added! 🍯`); }}
                                className="flex-1 min-w-[160px] bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl flex items-center justify-center gap-2 btn-bounce shadow-lg shadow-amber-200 transition-colors text-sm py-3">
                                <I d={ic.cart} size={17} stroke="#1a1a1a" /> Add to Cart — {fmt(p.price * qty)}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {[["🚚", "Free delivery over ৳500"], ["🔄", "7-day easy returns"], ["🔒", "Secure checkout"], ["✅", "Quality guaranteed"]].map(([icon, text]) => (
                            <div key={text} className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5 text-xs text-stone-600 font-medium">
                                <span>{icon}</span>{text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <div className="flex border-b border-stone-100">
                    {["description", "reviews", "faq"].map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 sm:px-8 py-4 text-sm font-medium capitalize transition-all border-b-2 ${tab === t ? "border-amber-500 text-amber-700 font-semibold" : "border-transparent text-stone-500 hover:text-stone-700"
                                }`}>
                            {t} {t === "reviews" && `(${reviews.length})`}
                        </button>
                    ))}
                </div>

                <div className="p-6 sm:p-8">
                    {tab === "description" && (
                        <p className="text-stone-600 leading-relaxed">{p.description || "Pure, natural honey with no additives. Sourced from trusted beekeepers across Bangladesh."}</p>
                    )}

                    {tab === "reviews" && (
                        reviews.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="text-5xl mb-3">⭐</div>
                                <p className="text-stone-400 text-sm">No reviews yet. Be the first!</p>
                            </div>
                        ) : (
                            reviews.map((r) => (
                                <div key={r._id} className="border-b border-stone-50 last:border-0 pb-5 mb-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                                                {/* ✅ FIX: Use customerName instead of reviewer.name */}
                                                {(r.customerName || r.name || "A")[0].toUpperCase()}
                                            </div>
                                            <div>
                                                {/* ✅ FIX: Use customerName instead of reviewer.name */}
                                                <div className="font-semibold text-stone-800 text-sm">
                                                    {r.customerName || r.name || "Anonymous"}
                                                </div>
                                                <Stars rating={r.rating} size={13} />
                                            </div>
                                        </div>
                                        <span className="text-stone-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {/* ✅ FIX: Use title field */}
                                    {r.title && <div className="font-semibold text-stone-700 mt-3 mb-1 text-sm">{r.title}</div>}
                                    {/* ✅ FIX: Use body field */}
                                    <p className="text-stone-500 text-sm leading-relaxed mt-2">{r.body || r.review}</p>
                                </div>
                            ))
                        )
                    )}

                    {tab === "faq" && (
                        <div className="space-y-3">
                            {[["Is the honey raw?", "Yes — all our honey is raw and unprocessed."],
                            ["How to store?", "Store in a cool, dry place away from sunlight."],
                            ["Does honey expire?", "Honey never truly expires. Crystallization is normal."],
                            ["Bulk orders?", "Contact us for bulk orders with special pricing."]
                            ].map(([q, a]) => (
                                <div key={q} className="bg-stone-50 rounded-xl p-5">
                                    <div className="font-semibold text-stone-800 mb-2 text-sm">Q: {q}</div>
                                    <div className="text-stone-500 text-sm leading-relaxed">A: {a}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;