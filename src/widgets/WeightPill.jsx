const ScaleIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

export const WeightPill = ({ weight }) => {
    if (!weight) return null;
    const display = weight >= 1000
        ? `${(weight / 1000).toFixed(weight % 1000 === 0 ? 0 : 1)} kg`
        : `${weight}g`;

    return (
        <div className="inline-flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-500 shadow-sm">
            <span className="text-amber-600"><ScaleIcon /></span>
            <span className="font-bold text-stone-800 text-sm">{display}</span>
            <span>net weight</span>
        </div>
    );
};
