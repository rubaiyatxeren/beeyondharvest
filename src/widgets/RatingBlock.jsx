/**
 * RatingBlock.jsx
 * ─────────────────────────────────────────────────────────────
 * Product rating section: animated star badge, love meter,
 * review count link, and trust badge (shown when ≥10 reviews).
 *
 * Used in: ProductPage
 *
 * Props:
 *   average       {number}   avg rating 0–5
 *   count         {number}   total review count
 *   onViewReviews {function} called when "X happy customers" clicked
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Stars } from '../components/common/Stars';

export const RatingBlock = ({ average = 0, count = 0, onViewReviews }) => {
    const pct = Math.round((average / 5) * 100);

    return (
        <div className="mb-5">
            {/* ── Top row: stars + animated badge + love meter ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Stars rating={average} size={20} />

                    {/* Animated rating badge with tooltip */}
                    <div className="relative group">
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                            <span className="text-white text-sm animate-pulse">★</span>
                            <span className="font-bold text-white text-base">{average.toFixed(1)}</span>
                            <span className="text-amber-200 text-xs">/ 5.0</span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white rounded-xl shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 border border-amber-100">
                            <div className="text-center">
                                <div className="text-2xl mb-1">✨</div>
                                <p className="text-xs text-stone-600 font-medium">
                                    {pct > 80 ? '⭐ Loved by customers'
                                        : pct > 60 ? '👍 Highly recommended'
                                            : '💫 Customer approved'}
                                </p>
                                <p className="text-[10px] text-stone-400 mt-1">Based on verified purchases</p>
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-amber-100" />
                        </div>
                    </div>
                </div>

                {/* Love meter — only when there are reviews */}
                {count > 0 && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-rose-50 to-amber-50 px-3 py-1.5 rounded-full">
                        <span className="text-rose-500 text-sm animate-pulse">❤️</span>
                        <span className="text-xs font-semibold text-stone-700">{pct}% Love This</span>
                    </div>
                )}
            </div>

            {/* ── Review count + verified ── */}
            <div className="flex items-center gap-2 mt-2 ml-1">
                <button onClick={onViewReviews} className="group flex items-center gap-1.5">
                    <span className="text-amber-500 text-sm transition-transform group-hover:scale-110">💬</span>
                    <span className="text-stone-500 text-xs group-hover:text-amber-600 transition-colors">{count}</span>
                    <span className="text-stone-400 text-xs">
                        {count === 1 ? 'happy customer' : 'happy customers'}
                    </span>
                </button>
                <div className="w-1 h-1 rounded-full bg-stone-300" />
                <div className="flex items-center gap-1">
                    <span className="text-emerald-500 text-xs">✓</span>
                    <span className="text-stone-400 text-[10px]">100% verified</span>
                </div>
            </div>

            {/* ── Trust badge — 10+ reviews ── */}
            {count >= 10 && (
                <div className="mt-3 bg-amber-50/50 rounded-xl p-2.5 border border-amber-100/50">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <div className="flex-1">
                            <p className="text-[11px] font-semibold text-stone-700">Trusted Choice</p>
                            <p className="text-[10px] text-stone-500">{count}+ customers can't be wrong</p>
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
    );
};