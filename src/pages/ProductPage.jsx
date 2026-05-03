import React, { useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Sk } from '../components/common/Skeleton';
import { Stars } from '../components/common/Stars';
import { useCart } from '../components/providers/CartProvider';
import { useNav } from '../components/providers/NavProvider';
import { useToast } from '../components/providers/ToastProvider';
import { useAPI } from '../hooks/useAPI';
import { CDN, fmt } from '../utils/helpers';
import { DiscountBadge, StockBadge } from '../widgets/HoneyBadge';
import { RatingBlock } from '../widgets/RatingBlock';
import { ShareDrawer } from '../widgets/ShareDrawer'; // ← new
import { WeightPill } from '../widgets/WeightPill'; // ← new

const ShareIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const ProductPage = ({ productId }) => {
    const { setPage } = useNav();
    const { data: raw, loading } = useAPI(`/api/products/${productId}`);
    const { data: rawReviews } = useAPI(`/api/reviews/product/${productId}`);
    const cart = useCart();
    const toast = useToast();
    const [qty, setQty] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [tab, setTab] = useState('description');
    const [shareOpen, setShareOpen] = useState(false);

    const p = raw?.product || raw;
    const reviews = rawReviews?.reviews || rawReviews || [];

    if (loading) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Sk className="h-96" />
                <div className="space-y-4">
                    <Sk className="h-8 w-3/4" /><Sk className="h-5 w-1/2" />
                    <Sk className="h-24" /><Sk className="h-12" />
                </div>
            </div>
        </div>
    );

    if (!p) return <div className="text-center py-20 text-stone-500">Product not found.</div>;

    const images = p.images || [];
    const average = p.ratings?.average || p.avgRating || 0;
    const count = p.reviewCount || p.ratings?.count || reviews.length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ animation: 'fadeIn .3s ease' }}>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-8 flex-wrap">
                <button onClick={() => setPage('home')} className="hover:text-amber-600 transition-colors font-medium">Home</button>
                <I d={ic.chev_r} size={12} />
                <button onClick={() => setPage('shop')} className="hover:text-amber-600 transition-colors font-medium">Shop</button>
                <I d={ic.chev_r} size={12} />
                <span className="text-stone-600 font-medium line-clamp-1">{p.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                {/* Product Images */}
                <div>
                    <div className="bg-amber-50 rounded-2xl overflow-hidden h-80 md:h-96 flex items-center justify-center mb-3">
                        {images[activeImg]
                            ? <img src={CDN(images[activeImg])} alt={p.name} className="w-full h-full object-cover" />
                            : <span className="text-9xl">🍯</span>}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {images.map((img, i) => (
                                <button key={i} onClick={() => setActiveImg(i)}
                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all btn-bounce ${activeImg === i ? 'border-amber-500' : 'border-transparent'}`}>
                                    <img src={CDN(img)} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        {p.category?.name || 'Honey'}
                    </span>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-3 leading-tight">{p.name}</h1>

                    <RatingBlock average={average} count={count} onViewReviews={() => setTab('reviews')} />

                    <div className="flex items-baseline gap-3 mb-5">
                        <span className="text-3xl font-bold text-stone-900">{fmt(p.price)}</span>
                        {p.comparePrice > p.price && (
                            <>
                                <span className="text-stone-400 line-through text-lg">{fmt(p.comparePrice)}</span>
                                <DiscountBadge originalPrice={p.comparePrice} price={p.price} />
                            </>
                        )}
                    </div>

                    <p className="text-stone-600 leading-relaxed mb-5 text-sm">
                        {p.description
                            ? p.description.length > 200 ? p.description.substring(0, 200) + '…' : p.description
                            : 'Premium quality honey, pure and natural.'}
                    </p>

                    {/* Weight + Share strip */}
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                        <WeightPill weight={p.weight} />
                        <div className="relative">
                            <button
                                onClick={() => setShareOpen((s) => !s)}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all btn-bounce shadow-sm ${shareOpen
                                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                                    : 'bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                                    }`}
                                aria-label="Share product"
                            >
                                <ShareIcon />
                                Share
                            </button>
                            <ShareDrawer
                                productName={p.name}
                                productId={p._id}
                                open={shareOpen}
                                onClose={() => setShareOpen(false)}
                            />
                        </div>
                    </div>

                    <div className="mb-5">
                        <StockBadge stock={p.stock} sku={p.sku} />
                    </div>

                    {p.stock > 0 && (
                        <div className="flex gap-3 mb-6 flex-wrap">
                            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600">
                                    <I d={ic.minus} size={15} />
                                </button>
                                <span className="w-12 text-center font-bold text-stone-900">{qty}</span>
                                <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600">
                                    <I d={ic.plus} size={15} />
                                </button>
                            </div>
                            <button
                                onClick={() => { cart.add(p, qty); toast(`${qty}× ${p.name} added! 🍯`); }}
                                className="flex-1 min-w-[160px] bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl flex items-center justify-center gap-2 btn-bounce shadow-lg shadow-amber-200 transition-colors text-sm py-3"
                            >
                                <I d={ic.cart} size={17} stroke="#1a1a1a" /> Add to Cart — {fmt(p.price * qty)}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {[['🚚', 'Free delivery over ৳500'], ['🔄', '7-day easy returns'], ['🔒', 'Secure checkout'], ['✅', 'Quality guaranteed']].map(([icon, text]) => (
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
                    {['description', 'reviews', 'faq'].map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 sm:px-8 py-4 text-sm font-medium capitalize transition-all border-b-2 ${tab === t ? 'border-amber-500 text-amber-700 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>
                            {t} {t === 'reviews' && `(${reviews.length})`}
                        </button>
                    ))}
                </div>
                <div className="p-6 sm:p-8">
                    {tab === 'description' && (
                        <p className="text-stone-600 leading-relaxed">
                            {p.description || 'Pure, natural honey with no additives. Sourced from trusted beekeepers across Bangladesh.'}
                        </p>
                    )}
                    {tab === 'reviews' && (
                        reviews.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="text-5xl mb-3">⭐</div>
                                <p className="text-stone-400 text-sm">No reviews yet. Be the first!</p>
                            </div>
                        ) : reviews.map((r) => (
                            <div key={r._id} className="border-b border-stone-50 last:border-0 pb-5 mb-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                                            {(r.customerName || r.name || 'A')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-stone-800 text-sm">{r.customerName || r.name || 'Anonymous'}</div>
                                            <Stars rating={r.rating} size={13} />
                                        </div>
                                    </div>
                                    <span className="text-stone-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                                {r.title && <div className="font-semibold text-stone-700 mt-3 mb-1 text-sm">{r.title}</div>}
                                <p className="text-stone-500 text-sm leading-relaxed mt-2">{r.body || r.review}</p>
                            </div>
                        ))
                    )}
                    {tab === 'faq' && (
                        <div className="space-y-3">
                            {[
                                ['Is the honey raw?', 'Yes — all our honey is raw and unprocessed.'],
                                ['How to store?', 'Store in a cool, dry place away from sunlight.'],
                                ['Does honey expire?', 'Honey never truly expires. Crystallization is normal.'],
                                ['Bulk orders?', 'Contact us for bulk orders with special pricing.'],
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
