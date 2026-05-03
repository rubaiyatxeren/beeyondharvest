// src/widgets/ShareDrawer.jsx

import { useEffect, useRef, useState } from 'react';

const SITE_URL = 'https://beeyondharvest.vercel.app';

const CopyIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const WA_ICON = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const FB_ICON = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

export const ShareDrawer = ({ productName, productId, open, onClose }) => {
    const dropdownRef = useRef(null);
    const sheetRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const isMobile = () => window.innerWidth < 640;

    // Desktop: close on outside click only
    useEffect(() => {
        if (!open || isMobile()) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
        };
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
    }, [open, onClose]);

    // Lock body scroll on mobile sheet open
    useEffect(() => {
        if (open && isMobile()) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const url = `${SITE_URL}/?page=product&id=${productId}`;

    const handleWA = () =>
        window.open(`https://wa.me/?text=${encodeURIComponent(`🍯 Check out "${productName}" on BeeHarvest!\n${url}`)}`, '_blank');

    const handleFB = () =>
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(url); }
        catch {
            const ta = Object.assign(document.createElement('textarea'), { value: url });
            document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const options = [
        { label: 'Share on WhatsApp', icon: WA_ICON, onClick: handleWA, cls: 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' },
        { label: 'Share on Facebook', icon: FB_ICON, onClick: handleFB, cls: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
        {
            label: copied ? '✓ Link copied!' : 'Copy link',
            icon: <CopyIcon />,
            onClick: handleCopy,
            cls: copied ? 'bg-green-50 text-green-700 border-green-100' : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100',
        },
    ];

    return (
        <>
            {/* ── MOBILE bottom sheet ── rendered via portal-like fixed positioning */}
            <div className="sm:hidden fixed inset-0 z-40" style={{ animation: 'fadeIn .15s ease' }}>
                {/* Backdrop — tap to close */}
                <div className="absolute inset-0 bg-black/40" onClick={onClose} />
                {/* Sheet — sits above backdrop */}
                <div
                    ref={sheetRef}
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl"
                    style={{ animation: 'slideUp .22s ease' }}
                >
                    <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                        Share this product
                    </p>
                    <p className="text-[10px] text-stone-300 font-mono truncate mb-5">{url}</p>
                    <div className="flex flex-col gap-3">
                        {options.map(({ label, icon, onClick, cls }) => (
                            <button
                                key={label}
                                onClick={onClick}
                                className={`flex items-center gap-3 w-full px-4 py-4 rounded-2xl border text-sm font-semibold transition-colors active:scale-95 ${cls}`}
                            >
                                {icon}{label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── DESKTOP dropdown ── */}
            <div
                ref={dropdownRef}
                className="hidden sm:block absolute z-20 top-full mt-2 left-0 bg-white border border-stone-200 rounded-2xl p-4 shadow-xl shadow-stone-100 w-56"
                style={{ animation: 'fadeIn .18s ease' }}
            >
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Share</p>
                <p className="text-[10px] text-stone-300 font-mono truncate mb-3">{url}</p>
                <div className="flex flex-col gap-2">
                    {options.map(({ label, icon, onClick, cls }) => (
                        <button
                            key={label}
                            onClick={onClick}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors btn-bounce ${cls}`}
                        >
                            {icon}{label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};
