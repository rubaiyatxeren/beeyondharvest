/**
 * ReadingProgress.jsx
 * ─────────────────────────────────────────────────────────────
 * Fixed 2px amber gradient bar at the top of the viewport that
 * fills as the user scrolls down the page.
 *
 * Used in: BlogDetail
 *
 * Props: none — self-contained, attaches its own scroll listener.
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';

export const ReadingProgress = () => {
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const el = document.documentElement;
            const total = el.scrollHeight - el.clientHeight;
            setPct(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-stone-200/60">
            <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-[width] duration-100 ease-linear"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
};