/**
 * HoneyBadge.jsx
 * ─────────────────────────────────────────────────────────────
 * Atomic badge / pill / chip components shared across
 * BlogPage, BlogDetail, ProductPage, HomePage, etc.
 *
 * Exports:
 *   CatBadge      – category label (default / featured / pinned)
 *   TagChip       – mono hashtag chip
 *   MetaPill      – icon + text stat (views, read time, …)
 *   StockBadge    – in-stock / out-of-stock
 *   DiscountBadge – "Save X%" red pill
 *   LangBadge     – Bengali / English content language
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';

/* ── CatBadge ──────────────────────────────────────────────── */
const CAT_STYLES = {
    default: 'bg-amber-100 text-amber-700 border border-amber-200',
    featured: 'bg-amber-500 text-white border border-amber-500',
    pinned: 'bg-stone-900 text-amber-300 border border-stone-900',
};

const CAT_PREFIX = {
    featured: '★ ',
    pinned: '📌 ',
};

export const CatBadge = ({ label, variant = 'default' }) => {
    if (!label) return null;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${CAT_STYLES[variant]}`}>
            {CAT_PREFIX[variant]}{label}
        </span>
    );
};

/* ── TagChip ───────────────────────────────────────────────── */
/**
 * @param {string}  tag
 * @param {boolean} [hoverable=false]  amber hover style (BlogDetail variant)
 */
export const TagChip = ({ tag, hoverable = false }) => (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-500 border border-stone-200
        ${hoverable ? 'hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors duration-200 cursor-default px-3 py-1 rounded-full' : ''}`}>
        #{tag}
    </span>
);

/* ── MetaPill ──────────────────────────────────────────────── */
/**
 * Small icon + value pair used in BlogDetail meta bar.
 * @param {React.ReactNode} icon
 */
export const MetaPill = ({ icon, children }) => (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-400 font-medium">
        <span className="text-stone-300">{icon}</span>
        <span>{children}</span>
    </span>
);

/* ── StockBadge ────────────────────────────────────────────── */
/**
 * @param {number} stock
 * @param {string} [sku]
 */
export const StockBadge = ({ stock, sku }) => (
    <div className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full
            ${stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <span>{stock > 0 ? '✓' : '✗'}</span>
            {stock > 0 ? `In Stock (${stock} available)` : 'Out of Stock'}
        </span>
        {sku && <span className="text-xs text-stone-400">SKU: {sku}</span>}
    </div>
);

/* ── DiscountBadge ─────────────────────────────────────────── */
/**
 * @param {number} originalPrice
 * @param {number} price
 * @returns {JSX.Element|null}  null when no discount
 */
export const DiscountBadge = ({ originalPrice, price }) => {
    const disc = originalPrice > price
        ? Math.round((1 - price / originalPrice) * 100)
        : 0;
    if (!disc) return null;
    return (
        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
            Save {disc}%
        </span>
    );
};

/* ── LangBadge ─────────────────────────────────────────────── */
/**
 * @param {'bn'|'en'} lang
 */
export const LangBadge = ({ lang }) => (
    <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border
        ${lang === 'bn'
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-sky-50 border-sky-200 text-sky-600'}`}>
        {lang === 'bn' ? '🇧🇩 Bengali' : '🇬🇧 English'}
    </span>
);