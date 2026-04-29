import React, { useState } from 'react';
import { CDN, fmt } from '../../utils/helpers';
import { useCart } from '../providers/CartProvider';
import { useToast } from '../providers/ToastProvider';
import { I, ic } from './Icons';
import { Stars } from './Stars';

export const ProductCard = ({ product, onView }) => {
    const [wished, setWished] = useState(false);
    const cart = useCart();
    const toast = useToast();

    const imgSrc = (() => {
        if (!product.images?.length) return null;
        const img = product.images[0];
        return typeof img === "string" ? CDN(img) : CDN(img?.url);
    })();

    const disc = product.comparePrice > product.price
        ? Math.round((1 - product.price / product.comparePrice) * 100)
        : 0;

    return (
        <div onClick={() => onView(product)} className="card-hover bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer group">
            <div className="relative bg-amber-50 overflow-hidden" style={{ paddingBottom: "72%" }}>
                {imgSrc ? (
                    <img src={imgSrc} alt={product.name} loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">🍯</div>
                )}

                {disc > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{disc}%</span>
                )}

                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="bg-stone-100 text-stone-500 text-xs font-semibold px-3 py-1.5 rounded-full">Out of Stock</span>
                    </div>
                )}

                <button onClick={(e) => { e.stopPropagation(); setWished(!wished); toast(wished ? "Removed from wishlist" : "Added to wishlist 💛", wished ? "warn" : "success"); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-bounce">
                    <I d={ic.heart} size={14} stroke={wished ? "#ef4444" : "#aaa"} fill={wished ? "#ef4444" : "none"} />
                </button>
            </div>

            <div className="p-4">
                <p className="text-xs text-amber-600 font-semibold mb-1">{product.category?.name || "Honey"}</p>
                <h3 className="font-display font-semibold text-stone-800 text-[15px] line-clamp-2 mb-2 leading-snug">{product.name}</h3>

                <div className="flex items-center gap-2 mb-3">
                    <Stars rating={product.ratings?.average || product.avgRating || 0} />
                    {(product.ratings?.count > 0 || product.reviewCount > 0) && (
                        <span className="text-xs text-stone-400">({product.ratings?.count || product.reviewCount})</span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-lg font-bold text-stone-900">{fmt(product.price)}</span>
                        {disc > 0 && <span className="text-xs text-stone-400 line-through ml-1.5">{fmt(product.comparePrice)}</span>}
                    </div>

                    {product.stock > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); cart.add(product); toast(`${product.name} added! 🍯`); }}
                            className="w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center btn-bounce shadow-md shadow-amber-200 transition-colors">
                            <I d={ic.plus} size={16} stroke="white" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};