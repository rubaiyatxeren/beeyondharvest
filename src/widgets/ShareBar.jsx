/**
 * ShareBar.jsx
 * ─────────────────────────────────────────────────────────────
 * Social share buttons: Facebook, X/Twitter, WhatsApp, LinkedIn.
 *
 * Used in: BlogDetail (sticky topbar + like-row)
 *
 * Props:
 *   title   {string}  page/post title for tweet text
 *   compact {boolean} smaller 32px buttons (topbar variant)
 *                     vs larger 36px buttons (article footer)
 *   label   {boolean} show "Share" label (default true)
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';

const SHARE_TARGETS = [
    {
        key: 'facebook',
        label: 'Facebook',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
        ),
        build: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    {
        key: 'twitter',
        label: 'X / Twitter',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        build: (u, t) => `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    },
    {
        key: 'whatsapp',
        label: 'WhatsApp',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M11.999 2C6.477 2 2 6.484 2 12.017c0 1.99.522 3.86 1.438 5.479L2 22l4.654-1.407A9.953 9.953 0 0 0 12 22c5.523 0 10-4.484 10-10.017C22 6.477 17.523 2 12 2z" />
            </svg>
        ),
        build: (u, t) => `https://wa.me/?text=${t}%20${u}`,
    },
    {
        key: 'linkedin',
        label: 'LinkedIn',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
            </svg>
        ),
        build: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
];

export const ShareBar = ({ title = '', compact = false, label = true }) => {
    const handleShare = ({ build }) => {
        const url = encodeURIComponent(window.location.href);
        const t = encodeURIComponent(title);
        window.open(build(url, t), '_blank', 'noopener,noreferrer');
    };

    const btnSize = compact ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl';

    return (
        <div className="flex items-center gap-2">
            {label && (
                <span className="text-[10px] sm:text-[11px] font-mono text-stone-400 uppercase tracking-[0.14em] mr-1">
                    Share
                </span>
            )}
            {SHARE_TARGETS.map((s) => (
                <button
                    key={s.key}
                    title={s.label}
                    onClick={() => handleShare(s)}
                    className={`${btnSize} border border-stone-200 bg-white text-stone-500 flex items-center justify-center
                        hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50
                        ${compact ? '' : 'hover:-translate-y-0.5'}
                        transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                    {s.icon}
                </button>
            ))}
        </div>
    );
};

/* Export targets separately for advanced use (e.g. custom positioning) */
export { SHARE_TARGETS };

