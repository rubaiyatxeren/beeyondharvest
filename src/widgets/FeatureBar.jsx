/**
 * FeatureBar.jsx
 * ─────────────────────────────────────────────────────────────
 * The amber stats strip below the hero section on the homepage.
 * Displays 4 trust-building stat tiles.
 *
 * Used in: HomePage
 *
 * Props:
 *   items  {Array<[icon, value, label]>}   defaults provided
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';

const DEFAULT_ITEMS = [
    ['🍯', '100% Pure', 'No Additives'],
    ['🌿', 'Organic', 'Lab Tested'],
    ['🚚', '24–48h', 'Fast Delivery'],
    ['⭐', '50K+', 'Happy Customers'],
];

export const FeatureBar = ({ items = DEFAULT_ITEMS }) => (
    <div className="bg-amber-500">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {items.map(([icon, val, label]) => (
                <div key={label} className="text-center py-2">
                    <div className="text-2xl">{icon}</div>
                    <div className="font-bold text-stone-900 font-display">{val}</div>
                    <div className="text-xs text-amber-800 font-medium">{label}</div>
                </div>
            ))}
        </div>
    </div>
);